import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';

import Login from './Login';

test('renders Login component correctly', () => {
    render(
        <Router>
            <Login />
        </Router>
    );

    const formContainer = screen.getByTestId('form');
    expect(formContainer).toBeInTheDocument();

    const logo = screen.getByAltText('logo');
    expect(logo).toBeInTheDocument();

    const formHeading = screen.getByText(/Login to collabordraw/i);
    expect(formHeading).toBeInTheDocument();

    const emailInput = screen.getByPlaceholderText('Enter your email id');
    expect(emailInput).toBeInTheDocument();
    expect(emailInput).toHaveAttribute('type', 'email');

    const passwordInput = screen.getByPlaceholderText('Enter password');
    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput).toHaveAttribute('type', 'password');

    const loginButton = screen.getByRole('button', { name: /Login/i });
    expect(loginButton).toBeInTheDocument();

    const signupLink = screen.getByRole('link', { name: /Signup/i });
    expect(signupLink).toBeInTheDocument();
    expect(signupLink).toHaveAttribute('href', '/signup');
})

test('renders signup message correctly', () => {
    render(
        <Router>
            <Login />
        </Router>
    );

    const message = screen.getByText(/Not signed up yet \? Click here to/i);
    expect(message).toBeInTheDocument();
});