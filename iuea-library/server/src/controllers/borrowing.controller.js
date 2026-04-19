const prisma         = require('../config/prisma');
const BorrowRequest  = require('../models/BorrowRequest');
const emailService   = require('../services/email.service');

const DEFAULT_LOAN_DAYS = 14;

// ── POST /api/borrowing  (student requests a book) ────────────────────────────
const requestBorrow = async (req, res, next) => {
  try {
    const { bookId } = req.body;
    if (!bookId) return res.status(400).json({ message: 'bookId is required.' });

    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) return res.status(404).json({ message: 'Book not found.' });

    // Check for existing active/pending request
    const existing = await BorrowRequest.findOne({
      userId: req.user.id,
      bookId,
      status: { $in: ['pending', 'approved', 'active'] },
    });
    if (existing) {
      return res.status(409).json({ message: 'You already have an active request for this book.' });
    }

    const request = await BorrowRequest.create({
      userId:       req.user.id,
      bookId,
      bookTitle:    book.title,
      bookAuthor:   book.author,
      bookCoverUrl: book.coverUrl,
    });

    // Notify admins via email (fire-and-forget)
    emailService.sendBorrowRequestNotification(req.user, book).catch(console.error);

    res.status(201).json({ request });
  } catch (err) { next(err); }
};

// ── GET /api/borrowing/my  (student sees their loans) ─────────────────────────
const getMyLoans = async (req, res, next) => {
  try {
    const loans = await BorrowRequest.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .lean();

    // Mark overdue
    const now = new Date();
    for (const loan of loans) {
      if (loan.status === 'active' && loan.dueDate && loan.dueDate < now) {
        await BorrowRequest.findByIdAndUpdate(loan._id, { status: 'overdue' });
        loan.status = 'overdue';
      }
    }

    res.json({ loans });
  } catch (err) { next(err); }
};

// ── DELETE /api/borrowing/:id  (student cancels pending request) ──────────────
const cancelRequest = async (req, res, next) => {
  try {
    const loan = await BorrowRequest.findOne({ _id: req.params.id, userId: req.user.id });
    if (!loan) return res.status(404).json({ message: 'Request not found.' });
    if (loan.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending requests can be cancelled.' });
    }
    await BorrowRequest.findByIdAndDelete(loan._id);
    res.json({ message: 'Request cancelled.' });
  } catch (err) { next(err); }
};

// ── POST /api/borrowing/:id/renew  (student requests renewal) ─────────────────
const requestRenewal = async (req, res, next) => {
  try {
    const loan = await BorrowRequest.findOne({ _id: req.params.id, userId: req.user.id });
    if (!loan) return res.status(404).json({ message: 'Loan not found.' });
    if (!['active', 'overdue'].includes(loan.status)) {
      return res.status(400).json({ message: 'Only active loans can be renewed.' });
    }
    if (loan.renewalCount >= 2) {
      return res.status(400).json({ message: 'Maximum renewals reached.' });
    }
    await BorrowRequest.findByIdAndUpdate(loan._id, { renewalRequested: true });
    res.json({ message: 'Renewal request submitted.' });
  } catch (err) { next(err); }
};

// ── GET /api/borrowing  (admin: all loans) ─────────────────────────────────────
const getAllLoans = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await BorrowRequest.countDocuments(filter);
    const loans = await BorrowRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('userId', 'name email studentId faculty avatar')
      .lean();

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

    const loan = await BorrowRequest.findById(req.params.id)
      .populate('userId', 'name email')
      .lean();
    if (!loan) return res.status(404).json({ message: 'Loan not found.' });

    const update = { status };
    if (adminNotes)     update.adminNotes     = adminNotes;
    if (shelfLocation)  update.shelfLocation  = shelfLocation;

    if (status === 'approved') {
      update.approvedAt = new Date();
      update.dueDate    = new Date(Date.now() + Number(loanDays) * 24 * 60 * 60 * 1000);
      // Email student
      emailService.sendBorrowApproved(loan.userId, loan, update.dueDate, shelfLocation, adminNotes).catch(console.error);
    }
    if (status === 'rejected') {
      emailService.sendBorrowRejected(loan.userId, loan, adminNotes).catch(console.error);
    }
    if (status === 'returned') {
      update.returnedAt = new Date();
      // Handle renewal approval
      if (loan.renewalRequested) {
        update.renewalRequested = false;
        update.renewalCount = (loan.renewalCount ?? 0) + 1;
        update.dueDate = new Date(Date.now() + Number(loanDays) * 24 * 60 * 60 * 1000);
        update.status  = 'active';
      }
    }

    const updated = await BorrowRequest.findByIdAndUpdate(req.params.id, update, { new: true }).lean();
    res.json({ loan: updated });
  } catch (err) { next(err); }
};

// ── GET /api/borrowing/stats  (admin: quick stats) ────────────────────────────
const getLoanStats = async (req, res, next) => {
  try {
    const [pending, active, overdue, returned] = await Promise.all([
      BorrowRequest.countDocuments({ status: 'pending' }),
      BorrowRequest.countDocuments({ status: 'active' }),
      BorrowRequest.countDocuments({ status: 'overdue' }),
      BorrowRequest.countDocuments({ status: 'returned' }),
    ]);
    res.json({ stats: { pending, active, overdue, returned } });
  } catch (err) { next(err); }
};

module.exports = { requestBorrow, getMyLoans, cancelRequest, requestRenewal, getAllLoans, updateLoanStatus, getLoanStats };
