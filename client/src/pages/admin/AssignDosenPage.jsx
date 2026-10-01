import { useNavigate } from 'react-router-dom';
import { ManageTimPage } from './ManageTimPage';
// Reuse ManageTimPage which has team listing + detail navigation
export default function AssignDosenPage() {
  return <ManageTimPage />;
}
