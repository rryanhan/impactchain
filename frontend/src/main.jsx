// frontend/src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Import Wagmi setup
import { WagmiConfig } from 'wagmi';
import { wagmiConfig } from './wagmiConfig.jsx';

// NEW IMPORTS for @tanstack/react-query:
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from "@material-tailwind/react";

// Create a new QueryClient instance
const queryClient = new QueryClient();

// Material Tailwind theme configuration (v1 format)
const theme = {
    button: {
        defaultProps: {
            variant: "filled",
            size: "md",
            color: "green",
            fullWidth: false,
            ripple: true,
        },
        styles: {
            base: {
                initial: {
                    textTransform: "normal",
                },
            },
        },
    },
};

// Create the root element
ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ThemeProvider value={theme}>
            <BrowserRouter>
                {/* Wrap with QueryClientProvider first */}
                <QueryClientProvider client={queryClient}>
                    {/* Then wrap with WagmiConfig */}
                    <WagmiConfig config={wagmiConfig}>
                        <App />
                    </WagmiConfig>
                </QueryClientProvider>
            </BrowserRouter>
        </ThemeProvider>
    </React.StrictMode>,
);