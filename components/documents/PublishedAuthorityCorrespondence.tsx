import Icon from "@/components/ui/Icon";
import PublishedEmailBatchOne from "./emails/PublishedEmailBatchOne";
import PublishedEmailBatchTwo from "./emails/PublishedEmailBatchTwo";
import PublishedEmailBatchThree from "./emails/PublishedEmailBatchThree";
import PublishedEmailBatchFour from "./emails/PublishedEmailBatchFour";

/**
 * React transcription of an already published HTML archive. This source
 * is reviewed public material, not an OpenRAG private document.
 * Keep the 13 dated anchors and exact correspondence text.
 * Source of truth before editorial approval of a new version:
 * public/ca/demande-explications-autorites-competentes-fr.html
 */
export default function PublishedAuthorityCorrespondence() {
  return (
    <div lang="fr" data-document-original-locale="fr">
<div className="ca-archive-body">
			<div className="container">
				<h1 id="doc-heading" className="display-6 mb-4">Demande d'explications écrites des autorités compétentes</h1>
				<p className="lead text-muted mb-4">
					Fil d'échanges avec l'Autorité centrale française (<a
						href="https://www.hcch.net/fr/instruments/conventions/full-text/?cid=24"
						target="_blank"
						rel="noopener noreferrer"
						>Convention de La Haye du 25 octobre 1980</a
					>).
				</p>


				<div className="email-thread">
										<PublishedEmailBatchOne />
					<PublishedEmailBatchTwo />
					<PublishedEmailBatchThree />
					<PublishedEmailBatchFour />
				</div>

				<section className="py-4" aria-labelledby="recipients-heading">
					<h2 id="recipients-heading" className="h5 mb-3">Destinataires impliqués</h2>
					<div className="row g-3 recipients-cards">
						<div className="col-md-6">
							<div className="card h-100">
								<div className="card-body d-flex align-items-start gap-3">
									<span
										className="flex-shrink-0 rounded-circle d-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary"
										style={{ width: "3rem", height: "3rem" }}
										aria-hidden="true"
										><Icon name="building" /></span>
									<div>
										<h3 className="h6 card-title mb-1">Maud BESNARD</h3>
										<p className="card-text text-muted small mb-0">
											Rédactrice, Département de l'entraide, du droit international privé et européen — Autorité
											centrale française (Convention de La Haye 1980). Direction des affaires civiles et du sceau,
											Ministère de la Justice, Paris.
										</p>
										<p className="card-text small mt-1 mb-0">
											<Icon name="mail" /> maud.besnard@justice.gouv.fr
										</p>
									</div>
								</div>
							</div>
						</div>
						<div className="col-md-6">
							<div className="card h-100">
								<div className="card-body d-flex align-items-start gap-3">
									<span
										className="flex-shrink-0 rounded-circle d-flex align-items-center justify-content-center bg-secondary bg-opacity-10 text-secondary"
										style={{ width: "3rem", height: "3rem" }}
										aria-hidden="true"
										><Icon name="user" /></span>
									<div>
										<h3 className="h6 card-title mb-1">Morgane POULARD</h3>
										<p className="card-text text-muted small mb-0">
											En copie sur plusieurs messages de ce fil. Autorité centrale française (Convention de La Haye
											1980).
										</p>
									</div>
								</div>
							</div>
						</div>
						<div className="row g-3 recipients-cards">
							<div className="col-md-6">
								<div className="card h-100">
									<div className="card-body d-flex align-items-start gap-3">
										<span
											className="flex-shrink-0 rounded-circle d-flex align-items-center justify-content-center bg-secondary bg-opacity-10 text-secondary"
											style={{ width: "3rem", height: "3rem" }}
											aria-hidden="true"
											><Icon name="user" /></span>
										<div>
											<h3 className="h6 card-title mb-1">M. A.</h3>
											<p className="card-text text-muted small mb-0">Le Papa.</p>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</section>

				<p className="mt-4 text-muted small">
					Document source :
					<a href="/ca/Gmail%20-%20Demande%20d'explications%20%C3%A9crites%20des%20autorit%C3%A9s%20comp%C3%A9tentes.pdf"
						>PDF Gmail – Demande d'explications écrites des autorités compétentes</a
					>. Voir aussi <a href="/central-authorities.html">central-authorities.html</a> et
					<a href="/abduction-germany.html">abduction-germany.html</a>.
				</p>
			</div>
		</div>
    </div>
  );
}
