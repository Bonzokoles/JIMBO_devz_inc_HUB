/**
 * Authentication Module
 * Handles Basic Auth and authorization for protected routes
 */

export async function requireDashboardAccess(request: Request): Promise<boolean> {
    const auth = request.headers.get('authorization');

    if (!auth || !auth.startsWith('Basic ')) {
        return false;
    }

    try {
        const credentials = atob(auth.slice(6));
        const [username, password] = credentials.split(':');

        // Constant-time comparison to prevent timing attacks
        return constantTimeEqual(username, 'Bonzo') &&
            constantTimeEqual(password, '#HAOS77#');
    } catch (error) {
        console.error('Auth parsing error:', error);
        return false;
    }
}

// Constant-time string comparison
function constantTimeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
        return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
}