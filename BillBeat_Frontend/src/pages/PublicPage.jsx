import { Link } from 'react-router-dom';
import Button from '../components/common/Button';
import PageHeader from '../components/layout/PageHeader';

export default function PublicPage() { return <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col justify-center gap-8"><PageHeader eyebrow="Newspaper vendor management" title="Your route, in focus." description="BillBeat is being built in phases. Authentication and vendor workflows will connect to the existing Spring Boot backend next." action={<Link to="/dashboard"><Button>Open workspace</Button></Link>} /><p className="text-sm text-[#706a65]">The workspace link is a foundation preview only. It contains no business data or mock backend responses.</p></div>; }
