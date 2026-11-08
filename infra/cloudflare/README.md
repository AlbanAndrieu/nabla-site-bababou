# Cloudflare Access — espace probatoire Bababou (non activé)

**État : infrastructure sous forme de code préparée, mais désactivée par défaut. Aucun domaine, Tunnel, compte, jeton ni politique Cloudflare n'a été modifié.**

## Activation après décision de publication

Lancer `terraform init`, `terraform validate` et `terraform plan` dans un environnement autorisé, **sans** appliquer avant d'avoir validé le backend. Les variables `TF_VAR_*` peuvent être fournies via un gestionnaire de secrets : aucun ID de compte, adresse d'approbateur ou jeton Cloudflare dans Git. Un plan inactif doit créer **zéro ressource**.

`nre-evidence-access.tf` prépare :
- une application **self_hosted** sur un **sous-domaine dédié** à choisir sous `bababou.com`, non pas le site public ou OpenRAG ;
- une politique Allow **limitée à des emails nominativement pré-qualifiés**, sans `Everyone`, OTP générique ou `Bypass` ;
- justification obligatoire + **approval_required** (une approbation par session) et liste d'approbateurs désignés ;
- session Access de **15 minutes**, MFA indépendant `security_key` ou `totp`, nouvelle MFA à chaque connexion ;
- cookie HttpOnly + SameSite strict + liaison du cookie si disponible.

L'approbation de Cloudflare Access n'est **pas** une autorisation générale d'accéder aux pièces : elle permet au demandeur d'atteindre la passerelle. La passerelle doit valider le JWT et les ACL documentaires, avec droits limités à des copies caviardées. Le propriétaire doit **pré-enregistrer l'email** du demandeur dans les emails autorisés après réception de la demande par Contact, puis autoriser la session demandée via Cloudflare. Une identité inconnue ne doit pas être autorisée via `Include Everyone`.

### Séquence obligatoire (non exécutée)

1. S'assurer que la page `/evidence-access` est correctement traduite et que le registre ne contient aucune pièce privée.
2. Mettre en place l'ingestion Docling/OpenRAG isolée sur TrueNAS, puis **une passerelle de lecture seule** indépendante. Corriger l'exposition historique du PDF de plainte déjà public si le propriétaire décide de le restreindre.
3. Installer le Tunnel vers la **passerelle**, avec `Protect with Access` activé et origine non joignable autrement. Créer la zone et le hostname vérifié.
4. Vérifier l'IdP, l'enrôlement MFA, les personnes d'approbation, la gestion du quota de sessions et la journalisation ; ne pas confondre passkey comme facteur primaire et MFA complémentaire.
5. Remplir `nre_cloudflare_account_id`, `nre_evidence_hostname`, `nre_approved_requester_emails`, `nre_approver_emails` **hors dépôt**, passer explicitement `nre_access_enabled=true`, auditer le plan et autoriser son application.
6. Tester 401 (anonyme), 403 (document hors autorisation), expiration/révocation, JWT invalide, accès direct à l'origine, cache/CDN, journaux et caviardage. Mettre à jour les métadonnées du registre **seulement après validation humaine** et publier par PR.
7. **Ne pas annoncer « portail actif » dans l'interface tant que l'accès n'est pas démontré.** La page publique n'a volontairement aucun lien vers le hostname privé.

### Ressources officielles

- <https://developers.cloudflare.com/cloudflare-one/access-controls/policies/temporary-auth/>
- <https://developers.cloudflare.com/cloudflare-one/access-controls/policies/mfa-requirements/>
- <https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/self-hosted-public-app/>
- <https://registry.terraform.io/providers/cloudflare/cloudflare/latest/docs/resources/zero_trust_access_policy>
- <https://registry.terraform.io/providers/cloudflare/cloudflare/latest/docs/resources/zero_trust_access_application>

**Après une fusion de la PR, cette configuration reste inerte jusqu'à un déploiement explicite et vérifié.**
