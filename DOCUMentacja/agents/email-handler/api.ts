// Email Handler Agent API

import type { AgentRequest, AgentResponse } from '../../Types/agent';
import { AGENT_CONFIG } from './config';

interface EmailConfig {
    service: 'gmail' | 'smtp' | 'sendgrid' | 'mailgun';
    apiKey?: string;
    host?: string;
    port?: number;
    user?: string;
    password?: string;
}

interface EmailMessage {
    to: string | string[];
    from: string;
    subject: string;
    text?: string;
    html?: string;
    attachments?: Array<{
        filename: string;
        content: string;
    }>;
}

export async function handleRequest(request: AgentRequest): Promise<AgentResponse> {
    const { action, data } = request;

    try {
        switch (action) {
            case 'test':
                return handleTest();
            case 'execute':
                return await handleExecute(data);
            case 'status':
                return handleStatus();
            default:
                throw new Error(`Unknown action: ${action}`);
        }
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error',
            data: { error: error instanceof Error ? error.name : 'Error' },
            timestamp: new Date().toISOString()
        };
    }
}

function handleTest(): AgentResponse {
    return {
        success: true,
        message: 'Email Handler agent test successful',
        data: {
            agent: AGENT_CONFIG.id,
            capabilities: AGENT_CONFIG.capabilities,
            supportedServices: ['gmail', 'smtp', 'sendgrid', 'mailgun']
        },
        timestamp: new Date().toISOString()
    };
}

async function handleExecute(data: { config: EmailConfig; message: EmailMessage; action: string }): Promise<AgentResponse> {
    const { config, message, action: emailAction } = data;

    if (emailAction === 'send') {
        return await sendEmail(config, message);
    } else if (emailAction === 'validate') {
        return validateEmail(message.to as string);
    }

    throw new Error(`Unknown email action: ${emailAction}`);
}

async function sendEmail(config: EmailConfig, message: EmailMessage): Promise<AgentResponse> {
    // Placeholder - requires nodemailer or email service SDK
    return {
        success: true,
        message: 'Email sending not implemented - requires email service',
        data: {
            to: message.to,
            subject: message.subject,
            status: 'not_implemented',
            message: 'Install nodemailer or email service SDK (sendgrid, mailgun)'
        },
        timestamp: new Date().toISOString()
    };
}

function validateEmail(email: string): AgentResponse {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);

    return {
        success: true,
        message: isValid ? 'Email is valid' : 'Email is invalid',
        data: {
            email,
            valid: isValid
        },
        timestamp: new Date().toISOString()
    };
}

function handleStatus(): AgentResponse {
    return {
        success: true,
        message: 'Agent is running',
        data: {
            agent: AGENT_CONFIG.id,
            status: AGENT_CONFIG.status
        },
        timestamp: new Date().toISOString()
    };
}
