# ScienceLift Frontend

Next.js frontend for the ScienceLift fitness research platform.

## 🚀 Quick Start

### Setup

```bash
# Install dependencies
npm install

# Configure environment
# .env.local (optional, defaults to http://localhost:8000/api/v1)
echo "NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1" > .env.local
```

### Run

```bash
# Development
npm run dev

# Production build
npm run build
npm start

# Export static site
npm run export
```

App available at http://localhost:3000

## 📁 Project Structure

```
src/
├── pages/               # Next.js pages (routes)
├── components/          # Reusable React components
├── context/             # React context (state management)
├── lib/                 # Utilities & API client
└── styles/              # CSS & Tailwind config
```

## 🎨 Design System

### Colors
- **Primary**: #0066cc (Blue)
- **Secondary**: #f5f5f5 (Light Gray)
- **Text**: #1a1a1a (Dark)
- **Border**: #e0e0e0 (Gray)

### Components
- `Header` - Top navigation & search
- `Sidebar` - Left nav with categories
- `PaperCard` - Paper display card
- `CommentThread` - Nested comments
- `ProtectedRoute` - Auth guard

## 🔐 Authentication

### Auth Flow

1. User registers/logs in
2. Backend returns `access_token` & `refresh_token`
3. Tokens stored in localStorage
4. Token sent in Authorization header for all requests
5. Auto-logout on 401 response

### Protected Pages

Wrap with `ProtectedRoute`:

```tsx
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function AdminPage() {
  return (
    <ProtectedRoute adminOnly>
      {/* Page content */}
    </ProtectedRoute>
  );
}
```

## 📊 State Management

### AuthContext
```tsx
const { user, isAuthenticated, login, logout } = useAuth();
```

### PaperContext
```tsx
const { papers, loading, loadPapers, toggleLike } = usePapers();
```

## 🌐 API Integration

Use `apiClient` from `@/lib/api.ts`:

```tsx
import { apiClient } from '@/lib/api';

// Login
await apiClient.login(email, password);

// Get papers
const response = await apiClient.getPapersFeed();

// Like paper
await apiClient.likePaper(paperId);
```

## 📱 Responsive Design

- Mobile: Single column
- Tablet: Sidebar + main
- Desktop: Sidebar + main + trending widget

Uses Tailwind CSS for responsive utilities.

## 🧪 Common Patterns

### Data Fetching

```tsx
useEffect(() => {
  loadPapers();
}, []);
```

### Form Handling

```tsx
const [email, setEmail] = useState('');
const handleSubmit = async (e) => {
  e.preventDefault();
  await apiClient.login(email, password);
};
```

### Error Handling

```tsx
try {
  await apiClient.login(email, password);
} catch (err) {
  setError(err.response?.data?.detail || 'Error');
}
```

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Connect your repo to Vercel
# Set environment variables in Vercel dashboard
# Auto-deploys on git push
```

### Self-Hosted

```bash
# Build
npm run build

# Start
npm start
```

Set `NEXT_PUBLIC_API_URL` to your backend URL.

## 📈 Performance

- Code splitting with Next.js
- Image optimization (next/image)
- CSS-in-JS with Tailwind
- Efficient state updates

## 🐛 Troubleshooting

### API 401 errors
- Check token in localStorage
- Verify NEXT_PUBLIC_API_URL is correct
- Backend may need CORS configuration

### Page not found
- Ensure pages directory structure matches routes
- Use `[id]` for dynamic routes

### Styling issues
- Clear `.next` folder: `rm -rf .next`
- Rebuild: `npm run build`

## 📚 Additional Resources

- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Axios Docs](https://axios-http.com/docs)

## 🔑 Key Libraries

- `axios` - HTTP client
- `zustand` - State management (alternative)
- `date-fns` - Date formatting
- `react-markdown` - Markdown rendering
- `react-icons` - Icon library
