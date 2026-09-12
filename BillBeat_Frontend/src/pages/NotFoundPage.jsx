import { Link } from 'react-router-dom';
import Button from '../components/common/Button';
import PageHeader from '../components/layout/PageHeader';

export default function NotFoundPage() { return <div className="mx-auto max-w-2xl space-y-8"><PageHeader eyebrow="404" title="That page is not in this edition." description="The route may have moved or is not available in the current foundation phase." action={<Link to="/"><Button>Return home</Button></Link>} /></div>; }
