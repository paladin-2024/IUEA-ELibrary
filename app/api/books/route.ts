export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || 'programming';
    const author = searchParams.get('author');
    const subject = searchParams.get('subject');
    const startIndex = searchParams.get('startIndex') || '0';
    const apiKey = process.env.GOOGLE_BOOKS_API_KEY;

    let searchQuery = query;
    if (author) {
        searchQuery = `inauthor:${author}`;
    } else if (subject) {
        searchQuery = `subject:${subject}`;
    }

    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchQuery)}&startIndex=${startIndex}${apiKey ? `&key=${apiKey}` : ''}`;
    
    try {
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`Google Books API responded with ${res.status}`);
        }
        const data = await res.json();
        return Response.json(data);
    } catch (error: any) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}