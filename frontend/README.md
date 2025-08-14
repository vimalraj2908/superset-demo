# 🚀 Brand Analytics Dashboard Frontend

A modern, responsive React frontend for the Brand Analytics Dashboard with integrated Apache Superset visualizations.

## ✨ Features

- **🔐 Secure Authentication**: JWT-based login system
- **📊 Interactive Dashboards**: Apache Superset integration
- **🎨 Modern UI**: Responsive design with smooth animations
- **📱 Mobile Friendly**: Optimized for all device sizes
- **🔄 Real-time Data**: Live metrics and analytics
- **🎯 Brand Management**: Multi-brand support with role-based access

## 🛠️ Tech Stack

- **Framework**: Next.js 14
- **Language**: JavaScript (ES6+)
- **Styling**: CSS-in-JS with global styles
- **Charts**: Apache Superset Embedded SDK
- **HTTP Client**: Axios
- **Authentication**: JWT tokens

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend API running on port 8080
- Superset running on port 8088

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   ```
   http://localhost:3000
   ```

### Build for Production

```bash
npm run build
npm start
```

## 🔑 Login Credentials

### Admin User
- **Email**: `om-stage@ausmit.in`
- **Password**: `password`
- **Access**: Full access to all brands and features

### Test User
- **Email**: `test@example.com`
- **Password**: `password123`
- **Access**: Limited access based on brand permissions

## 📱 Pages & Features

### 1. Login Page (`/`)
- Clean, modern login interface
- Demo credentials display
- Token testing tools
- Responsive design

### 2. Dashboard (`/dashboard`)
- Overview of all accessible brands
- Brand cards with key information
- Quick navigation to brand details
- Logout functionality

### 3. Brand Detail (`/brand/[brandId]`)
- Brand-specific metrics and analytics
- **Superset Dashboard Integration**
- Interactive charts and visualizations
- Real-time data updates

## 🔧 Superset Integration

The frontend integrates with Apache Superset using the `@superset-ui/embedded-sdk`:

### Dashboard Configuration
- **Dashboard ID**: `df2a444a-8df2-43ae-bae6-d61c4a717956`
- **Superset Domain**: `http://localhost:8088`
- **Authentication**: Guest token-based access

### Features
- Embedded dashboards with full interactivity
- Responsive chart layouts
- Real-time data filtering
- Cross-chart interactions

## 🎨 UI Components

### Styling System
- **Color Palette**: Modern, accessible colors
- **Typography**: Clean, readable fonts
- **Spacing**: Consistent 8px grid system
- **Animations**: Smooth hover effects and transitions

### Responsive Design
- Mobile-first approach
- Breakpoints: 768px, 1024px
- Flexible grid layouts
- Touch-friendly interactions

## 🔒 Security Features

- JWT token authentication
- Secure token storage
- Automatic token validation
- Role-based access control
- CORS protection

## 🚨 Error Handling

- User-friendly error messages
- Automatic token refresh
- Graceful fallbacks
- Loading states and retry mechanisms

## 📊 API Integration

### Endpoints Used
- `POST /api/auth/login` - User authentication
- `GET /api/brands` - Fetch user's brands
- `GET /api/brands/{id}` - Brand details
- `GET /api/brands/{id}/metrics/summary` - Brand metrics
- `GET /api/brands/{id}/reports/iframe` - Superset guest token

### Data Flow
1. User logs in → receives JWT token
2. Token stored in localStorage
3. API calls include token in Authorization header
4. Backend validates token and returns data
5. Frontend displays data and embeds Superset dashboard

## 🧪 Testing

### Manual Testing
- Login with different credentials
- Navigate between brands
- Test dashboard interactions
- Verify responsive design

### Token Testing
- Use the "Test Token" button on login page
- Verify API connectivity
- Check token validity

## 🚀 Deployment

### Environment Variables
```bash
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_SUPERSET_URL=http://localhost:8088
```

### Docker Deployment
```bash
# Build the image
docker build -t brand-dashboard-frontend .

# Run the container
docker run -p 3000:3000 brand-dashboard-frontend
```

## 🔧 Troubleshooting

### Common Issues

1. **Dashboard not loading**
   - Check Superset is running on port 8088
   - Verify backend is generating valid guest tokens
   - Check browser console for CORS errors

2. **Authentication errors**
   - Clear localStorage and re-login
   - Verify backend JWT configuration
   - Check token expiration

3. **Styling issues**
   - Clear browser cache
   - Verify CSS is loading properly
   - Check for conflicting styles

### Debug Tools
- Browser Developer Tools
- Network tab for API calls
- Console for error messages
- Token testing buttons on login page

## 📈 Performance

- Lazy loading of dashboard components
- Optimized bundle size
- Efficient state management
- Minimal re-renders

## 🤝 Contributing

1. Follow existing code style
2. Add proper error handling
3. Test on multiple devices
4. Update documentation

## 📄 License

This project is part of the Brand Analytics Dashboard system.

---

**Happy Coding! 🎉**
