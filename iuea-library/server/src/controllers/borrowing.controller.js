'use strict';

const prisma       = require('../config/prisma');
const emailService = require('../services/email.service');

const DEFAULT_LOAN_DAYS = 14;

// ── POST /api/borrowing  (student requests a book) ────────────────────────────
const requestBorrow = async (req, res, next) => {
  try {
    const { bookId } = req.body;
    if (!bookId) return res.status(400).json({ message: 'bookId is required.' });

    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) return res.status(404).json({ message: 'Book not found.' });

    const existing = await prisma.borrowRequest.findFirst({
      where: { userId: req.user.id, bookId, status: { in: ['pending', 'approved', 'active'] } },
    });
    if (existing) {
      return res.status(409).json({ message: 'You already have an active request for this book.' });
    }

    const request = await prisma.borrowRequest.create({
      data: {
        userId:       req.user.id,
        bookId,
        bookTitle:    book.title,
        bookAuthor:   book.author,
        bookCoverUrl: book.coverUrl,
      },
    });

    emailService.sendBorrowRequestNotification(req.user, book).catch(console.error);
    res.status(201).json({ request });
  } catch (err) { next(err); }
};

// ── GET /api/borrowing/my  (student sees their loans) ─────────────────────────
const getMyLoans = async (req, res, next) => {
  try {
    const loans = await prisma.borrowRequest.findMany({
      where:   { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();
    const updated = await Promise.all(loans.map(async (loan) => {
      if (loan.status === 'active' && loan.dueDate && loan.dueDate < now) {
        return prisma.borrowRequest.update({ where: { id: loan.id }, data: { status: 'overdue' } });
      }
      return loan;
    }));

    res.json({ loans: updated });
  } catch (err) { next(err); }
};

// ── DELETE /api/borrowing/:id  (student cancels pending request) ──────────────
const cancelRequest = async (req, res, next) => {
  try {
    const loan = await prisma.borrowRequest.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!loan) return res.status(404).json({ message: 'Request not found.' });
    if (loan.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending requests can be cancelled.' });
    }
    await prisma.borrowRequest.delete({ where: { id: loan.id } });
    res.json({ message: 'Request cancelled.' });
  } catch (err) { next(err); }
};

// ── POST /api/borrowing/:id/renew  (student requests renewal) ─────────────────
const requestRenewal = async (req, res, next) => {
  try {
    const loan = await prisma.borrowRequest.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!loan) return res.status(404).json({ message: 'Loan not found.' });
    if (!['active', 'overdue'].includes(loan.status)) {
      return res.status(400).json({ message: 'Only active loans can be renewed.' });
    }
    if (loan.renewalCount >= 2) {
      return res.status(400).json({ message: 'Maximum renewals reached.' });
    }
    await prisma.borrowRequest.update({ where: { id: loan.id }, data: { renewalRequested: true } });
    res.json({ message: 'Renewal request submitted.' });
  } catch (err) { next(err); }
};

// ── GET /api/borrowing  (admin: all loans) ─────────────────────────────────────
const getAllLoans = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const where = {};
    if (status) where.status = status;

    const skip  = (Number(page) - 1) * Number(limit);
    const [total, loans] = await Promise.all([
      prisma.borrowRequest.count({ where }),
      prisma.borrowRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take:    Number(limit),
        include: { user: { select: { name: true, email: true, studentId: true, faculty: true, avatar: true } } },
      }),
    ]);

    res.json({ loans, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) { next(err); }
};

// ── PATCH /api/borrowing/:id  (admin: approve / reject / mark returned) ────────
const updateLoanStatus = async (req, res, next) => {
  try {
    const { status, adminNotes, shelfLocation, loanDays = DEFAULT_LOAN_DAYS } = req.body;
    const validTransitions = ['approved', 'rejected', 'active', 'returned'];
    if (!validTransitions.includes(status)) {
      return res.status(400).json({ message: `Invalid status: ${status}` });
    }

    const loan = await prisma.borrowRequest.findUnique({
      where:   { id: req.params.id },
      include: { user: { select: { name: true, email: true } } },
    });
    if (!loan) return res.status(404).json({ message: 'Loan not found.' });

    const data = { status };
    if (adminNotes)    data.adminNotes    = adminNotes;
    if (shelfLocation) data.shelfLocation = shelfLocation;

    if (status === 'approved') {
      data.approvedAt = new Date();
      data.dueDate    = new Date(Date.now() + Number(loanDays) * 24 * 60 * 60 * 1000);
      emailService.sendBorrowApproved(loan.user, loan, data.dueDate, shelfLocation, adminNotes).catch(console.error);
    }
    if (status === 'rejected') {
      emailService.sendBorrowRejected(loan.user, loan, adminNotes).catch(console.error);
    }
    if (status === 'returned') {
      if (loan.renewalRequested) {
        // Approve renewal — extend loan instead of marking returned
        data.status           = 'active';
        data.renewalRequested = false;
        data.renewalCount     = (loan.renewalCount ?? 0) + 1;
        data.dueDate          = new Date(Date.now() + Number(loanDays) * 24 * 60 * 60 * 1000);
      } else {
        data.returnedAt = new Date();
      }
    }

    const updated = await prisma.borrowRequest.update({ where: { id: req.params.id }, data });
    res.json({ loan: updated });
  } catch (err) { next(err); }
};

// ── GET /api/borrowing/stats  (admin: quick stats) ────────────────────────────
const getLoanStats = async (req, res, next) => {
  try {
    const [pending, active, overdue, returned] = await Promise.all([
      prisma.borrowRequest.count({ where: { status: 'pending'  } }),
      prisma.borrowRequest.count({ where: { status: 'active'   } }),
      prisma.borrowRequest.count({ where: { status: 'overdue'  } }),
      prisma.borrowRequest.count({ where: { status: 'returned' } }),
    ]);
    res.json({ stats: { pending, active, overdue, returned } });
  } catch (err) { next(err); }
};

module.exports = { requestBorrow, getMyLoans, cancelRequest, requestRenewal, getAllLoans, updateLoanStatus, getLoanStats };
