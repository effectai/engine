import { useNavigate } from 'react-router-dom';

export function Redirect() {
    const navigate = useNavigate();
    navigate('/introduction/project-overview');
    return null;
}