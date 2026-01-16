"""
Input validation and security layer for MoE-RAG
Prevents SQL injection, XSS, prompt injection, and other attacks
"""

import re
import logging
from typing import Tuple

logger = logging.getLogger(__name__)


class InputValidator:
    """
    Validates and sanitizes user inputs
    Production-grade security checks
    """

    # SQL injection patterns
    SQL_KEYWORDS = {
        "SELECT",
        "INSERT",
        "UPDATE",
        "DELETE",
        "DROP",
        "CREATE",
        "ALTER",
        "TRUNCATE",
        "UNION",
        "WHERE",
        "FROM",
        "JOIN",
        "EXEC",
        "EXECUTE",
        "SCRIPT",
        "JAVASCRIPT",
        "EVAL",
    }

    # Prompt injection keywords
    PROMPT_INJECTION_KEYWORDS = {
        "ignore",
        "forget",
        "override",
        "system prompt",
        "jailbreak",
        "pretend",
        "roleplay",
        "new instructions",
        "disregard",
        "bypass",
        "ignore previous",
        "ignore all",
        "reset system",
        "do not",
        "don't",
        "never",
        "always tell me",
    }

    # XSS patterns
    XSS_PATTERNS = [
        r"<script[^>]*>.*?</script>",
        r"javascript:",
        r"on\w+\s*=",
        r"<iframe",
        r"<embed",
        r"<object",
    ]

    # Configuration
    MAX_QUERY_LENGTH = 2000  # characters
    MAX_QUERY_LENGTH_TOKENIZED = 500  # rough token estimate
    MIN_QUERY_LENGTH = 2  # characters

    @staticmethod
    def validate_query(query: str) -> Tuple[bool, str, str]:
        """
        Validate user query for security and quality

        Args:
            query: User input query

        Returns:
            (is_valid, error_message, cleaned_query)
        """
        if not query:
            return False, "Query cannot be empty", ""

        # Check length
        if len(query) < InputValidator.MIN_QUERY_LENGTH:
            return (
                False,
                f"Query too short (min {InputValidator.MIN_QUERY_LENGTH} chars)",
                "",
            )

        if len(query) > InputValidator.MAX_QUERY_LENGTH:
            return (
                False,
                f"Query too long (max {InputValidator.MAX_QUERY_LENGTH} chars)",
                "",
            )

        # Check SQL injection patterns
        is_sql_safe, sql_error = InputValidator._check_sql_injection(query)
        if not is_sql_safe:
            logger.warning(f"Potential SQL injection detected: {query[:100]}")
            return False, sql_error, ""

        # Check XSS patterns
        is_xss_safe, xss_error = InputValidator._check_xss(query)
        if not is_xss_safe:
            logger.warning(f"Potential XSS detected: {query[:100]}")
            return False, xss_error, ""

        # Check prompt injection
        is_prompt_safe, prompt_error = InputValidator._check_prompt_injection(query)
        if not is_prompt_safe:
            logger.warning(f"Potential prompt injection detected: {query[:100]}")
            return False, prompt_error, ""

        # Sanitize and clean
        cleaned_query = InputValidator._sanitize(query)

        logger.info(f"✅ Query validated successfully: {cleaned_query[:50]}...")
        return True, "", cleaned_query

    @staticmethod
    def _check_sql_injection(query: str) -> Tuple[bool, str]:
        """Check for SQL injection patterns"""
        # Normalize to uppercase for keyword checking
        query_upper = query.upper()

        # Check for SQL keywords combined with quotes/semicolons
        suspicious_patterns = [
            r"(['\"];)\s*(SELECT|INSERT|UPDATE|DELETE|DROP|UNION)",
            r"(OR|AND)\s+('1'='1'|1=1|true)",
            r"(UNION|UNION ALL)\s+(SELECT|ALL)",
            r"(;|--)\s*(SELECT|DROP|DELETE|INSERT)",
        ]

        for pattern in suspicious_patterns:
            if re.search(pattern, query_upper, re.IGNORECASE):
                return False, "SQL injection pattern detected"

        # Check for comments that might hide SQL
        if "--" in query or "/*" in query or "*/" in query:
            return False, "SQL comment patterns detected"

        return True, ""

    @staticmethod
    def _check_xss(query: str) -> Tuple[bool, str]:
        """Check for XSS patterns"""
        for pattern in InputValidator.XSS_PATTERNS:
            if re.search(pattern, query, re.IGNORECASE):
                return False, "XSS pattern detected"

        return True, ""

    @staticmethod
    def _check_prompt_injection(query: str) -> Tuple[bool, str]:
        """Check for prompt injection patterns"""
        query_lower = query.lower()

        # Count suspicious keywords
        suspicious_count = sum(
            1
            for keyword in InputValidator.PROMPT_INJECTION_KEYWORDS
            if keyword.lower() in query_lower
        )

        # If 3+ keywords, likely prompt injection
        if suspicious_count >= 3:
            return (
                False,
                f"Potential prompt injection (found {suspicious_count} suspicious keywords)",
            )

        # Check for specific patterns that are common in jailbreak attempts
        jailbreak_patterns = [
            r"ignore\s+(all\s+)?previous",
            r"(new|ignore)\s+instructions",
            r"system\s+prompt",
            r"pretend\s+you",
            r"act\s+as",
        ]

        for pattern in jailbreak_patterns:
            if re.search(pattern, query_lower, re.IGNORECASE):
                # Allow "act as" and "pretend you" for legitimate use (roleplay queries)
                # but flag if combined with other suspicious keywords
                if suspicious_count >= 2:
                    return False, "Potential jailbreak attempt"

        return True, ""

    @staticmethod
    def _sanitize(query: str) -> str:
        """
        Clean and normalize query
        - Strip whitespace
        - Remove control characters
        - Normalize quotes
        """
        # Remove leading/trailing whitespace
        query = query.strip()

        # Remove control characters (but keep newlines and tabs)
        query = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", query)

        # Normalize multiple spaces to single space
        query = re.sub(r"\s+", " ", query)

        # Normalize quotes (convert fancy quotes to standard)
        query = query.replace('"', '"').replace('"', '"')
        query = query.replace(""", "'").replace(""", "'")

        return query

    @staticmethod
    def validate_user_id(user_id: str) -> Tuple[bool, str]:
        """Validate user ID format"""
        if not user_id or len(user_id) > 255:
            return False, "Invalid user ID"

        # Allow alphanumeric, hyphens, underscores
        if not re.match(r"^[a-zA-Z0-9_-]+$", user_id):
            return False, "User ID contains invalid characters"

        return True, ""

    @staticmethod
    def validate_session_id(session_id: str) -> Tuple[bool, str]:
        """Validate session ID (typically UUID)"""
        uuid_pattern = r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"

        if not re.match(uuid_pattern, session_id.lower()):
            return False, "Invalid session ID format"

        return True, ""


# ============================================================================
# MIDDLEWARE/DECORATOR USAGE
# ============================================================================


def validate_input_middleware(query: str) -> Tuple[bool, str, str]:
    """
    Middleware function for validating inputs in route handlers

    Usage:
        is_valid, error, cleaned = validate_input_middleware(request.query)
        if not is_valid:
            return {"error": error}, 400
    """
    validator = InputValidator()
    return validator.validate_query(query)
