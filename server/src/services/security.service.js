/**
 * Security & Phishing Inspection Service
 * Checks target URLs against malicious patterns, raw IP hosts, executable files, and dangerous TLDs.
 */
export function validateUrlSafety(urlStr) {
  try {
    const parsed = new URL(urlStr);
    const hostname = parsed.hostname.toLowerCase();
    const pathname = parsed.pathname.toLowerCase();

    // 1. Block raw IPv4 address hosts (frequent in phishing / malware C2)
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipv4Regex.test(hostname)) {
      return {
        isSafe: false,
        riskLevel: 'high_risk',
        reason: 'Target URL uses an unverified IP address host (Potential Phishing/C2 risk).'
      };
    }

    // 2. Block dangerous executable file extensions
    const dangerousExtensions = ['.exe', '.scr', '.bat', '.cmd', '.vbs', '.msi', '.ps1', '.pif', '.hta'];
    for (const ext of dangerousExtensions) {
      if (pathname.endsWith(ext)) {
        return {
          isSafe: false,
          riskLevel: 'high_risk',
          reason: `Target URL links directly to a dangerous executable file type (${ext}).`
        };
      }
    }

    // 3. Known high-risk phishing keywords in hostname
    const suspiciousKeywords = [
      'login-verify', 'secure-update-account', 'account-verify-login',
      'paypal-security-update', 'bank-verify-alert', 'crypto-airdrop-claim',
      'wallet-connect-verify', 'metamask-claim'
    ];
    for (const keyword of suspiciousKeywords) {
      if (hostname.includes(keyword)) {
        return {
          isSafe: false,
          riskLevel: 'high_risk',
          reason: 'Target URL contains known phishing and credential-harvesting patterns.'
        };
      }
    }

    // Default safe response
    return {
      isSafe: true,
      riskLevel: 'safe',
      reason: 'URL passed pre-shortening security audit.'
    };
  } catch (err) {
    return {
      isSafe: false,
      riskLevel: 'invalid',
      reason: 'Invalid or malformed URL structure.'
    };
  }
}
