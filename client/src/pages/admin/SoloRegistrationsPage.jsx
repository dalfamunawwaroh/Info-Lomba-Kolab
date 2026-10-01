import { useNavigate } from 'react-router-dom';
export default function SoloRegistrationsPage() {
  const navigate = useNavigate();
  // Redirect to teams management which includes solo registrations
  navigate('/admin/teams');
  return null;
}
