import { LegalPage, LegalH2, LegalP } from './LegalPage'

/**
 * Mentions légales. Les coordonnées de l'éditeur marquées [À COMPLÉTER] doivent
 * être renseignées avant toute mise en ligne publique.
 */
export function MentionsLegales() {
  return (
    <LegalPage title="Mentions légales" updatedAt="16 juin 2026">
      <LegalH2>Éditeur</LegalH2>
      <LegalP>
        Le site et l’application Memo sont édités par Arthur Descourvieres, dans le cadre d’un
        projet de fin de formation au titre professionnel Concepteur Développeur d’Applications.
      </LegalP>
      <LegalP>
        Adresse : [À COMPLÉTER] — Adresse e-mail de contact : [À COMPLÉTER] — Statut : [À COMPLÉTER,
        ex. auto-entrepreneur / projet étudiant non commercial].
      </LegalP>

      <LegalH2>Directeur de la publication</LegalH2>
      <LegalP>Arthur Descourvieres.</LegalP>

      <LegalH2>Hébergement</LegalH2>
      <LegalP>
        L’application est hébergée au sein de l’Union européenne par Hetzner Online GmbH —
        Industriestr. 25, 91710 Gunzenhausen, Allemagne — hetzner.com. Les données sont stockées sur
        des serveurs situés dans l’UE.
      </LegalP>

      <LegalH2>Propriété intellectuelle</LegalH2>
      <LegalP>
        L’ensemble des éléments de l’application (code, interface, identité visuelle, contenus
        éditoriaux) est protégé par le droit de la propriété intellectuelle. Les contenus que vous
        créez (notes, dossiers, fichiers) restent votre propriété. Toute reproduction de
        l’application sans autorisation est interdite.
      </LegalP>

      <LegalH2>Responsabilité</LegalH2>
      <LegalP>
        Memo est un projet pédagogique fourni « en l’état ». L’éditeur s’efforce d’assurer la
        disponibilité et l’exactitude du service mais ne saurait être tenu responsable d’une
        interruption, d’une perte de données ou d’un usage non conforme.
      </LegalP>

      <LegalH2>Données personnelles</LegalH2>
      <LegalP>
        Le traitement de vos données personnelles est décrit dans la Politique de confidentialité,
        accessible depuis le pied de page. Vous y disposez de droits d’accès, de portabilité et
        d’effacement, exerçables directement depuis votre compte.
      </LegalP>
    </LegalPage>
  )
}
