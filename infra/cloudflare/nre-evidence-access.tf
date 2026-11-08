# Safely inert until an owner-approved private gateway, tunnel and IdP exist.
# Do not 'terraform apply' with enabled=true against an unverified origin.
terraform {
  required_version = ">= 1.6.0"
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.24"
    }
  }
}

variable "nre_access_enabled" {
  description = "False by default; activate only after gateway and redaction GO."
  type        = bool
  default     = false
}

variable "nre_cloudflare_account_id" {
  description = "Cloudflare account that owns the Access policies."
  type        = string
  default     = ""
}

variable "nre_evidence_hostname" {
  description = "Dedicated private gateway hostname under bababou.com, NOT the public site."
  type        = string
  default     = ""
  validation {
    condition     = var.nre_evidence_hostname == "" || can(regex("^[a-z0-9][a-z0-9.-]*[.]bababou[.]com$", var.nre_evidence_hostname))
    error_message = "Choose a dedicated hostname under bababou.com."
  }
}

variable "nre_approved_requester_emails" {
  description = "Individual identities pre-screened after a contact request. Never Everyone/OTP."
  type        = set(string)
  default     = []
}

variable "nre_approver_emails" {
  description = "Trusted approvers, who must also authenticate to Access."
  type        = set(string)
  default     = []
}

resource "cloudflare_zero_trust_access_policy" "nre_temporary" {
  count      = var.nre_access_enabled ? 1 : 0
  account_id = var.nre_cloudflare_account_id
  name       = "Bababou private evidence — approval per session"
  decision   = "allow"

  include = [for address in sort(tolist(var.nre_approved_requester_emails)) : {
    email = { email = address }
  }]

  purpose_justification_required = true
  purpose_justification_prompt   = "State your legal role, public NRE reference and purpose. Do not paste personal data."
  approval_required              = true
  approval_groups = [{
    approvals_needed = 1
    email_addresses  = sort(tolist(var.nre_approver_emails))
  }]
  session_duration = "15m"

  lifecycle {
    precondition {
      condition = (
        length(var.nre_cloudflare_account_id) > 0 &&
        length(var.nre_evidence_hostname) > 0 &&
        length(var.nre_approved_requester_emails) > 0 &&
        length(var.nre_approver_emails) > 0
      )
      error_message = "Access remains closed until account, hostname, requester allowlist and approvers are configured."
    }
  }
}

resource "cloudflare_zero_trust_access_application" "nre_evidence" {
  count      = var.nre_access_enabled ? 1 : 0
  account_id = var.nre_cloudflare_account_id
  name       = "Bababou evidence (private gateway)"
  type       = "self_hosted"
  domain     = var.nre_evidence_hostname
  app_launcher_visible = false

  policies = [{
    id         = cloudflare_zero_trust_access_policy.nre_temporary[0].id
    precedence = 1
  }]

  # Access only protects the gate; the gateway MUST check JWT and per-document ACL.
  session_duration             = "15m"
  http_only_cookie_attribute   = true
  same_site_cookie_attribute   = "strict"
  enable_binding_cookie        = true
  allow_iframe                 = false

  mfa_config = {
    allowed_authenticators = ["security_key", "totp"]
    mfa_disabled           = false
    session_duration       = "0m"  # fresh MFA at every login
  }
}
