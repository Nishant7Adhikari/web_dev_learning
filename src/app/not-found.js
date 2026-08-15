import Link from 'next/link'

export default function NotFound() {
  return (
    <main>
      <div className="container">
        <h1>Not Available</h1>
        <p>The site you are looking for does not exist.</p>
        <p>
          Kindly contact: <a href="mailto:nshntdhkr@gmail.com">developer</a>
        </p>
        <Link href="/">
          Return to Homepage?
        </Link>
      </div>
    </main>
  );
}
