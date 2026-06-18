import type { CSSProperties } from 'react'
import { LegalPage, LegalH2, LegalP } from './LegalPage'

/**
 * Politique de confidentialité. Le contenu décrit le traitement réellement
 * implémenté (minimisation, grâce de 30 jours, export JSON, anonymisation).
 */
export function Confidentialite() {
  return (
    <LegalPage title="Politique de confidentialité" updatedAt="16 juin 2026">
      <LegalP>
        Memo applique le principe de minimisation : nous ne collectons que les données strictement
        nécessaires au fonctionnement du service de prise de notes collaborative.
      </LegalP>

      <LegalH2>Responsable du traitement</LegalH2>
      <LegalP>
        Arthur Descourvieres, éditeur de Memo (voir les mentions légales). Pour toute question
        relative à vos données : [À COMPLÉTER — adresse e-mail de contact].
      </LegalP>

      <LegalH2>Données collectées</LegalH2>
      <ul style={listStyle}>
        <li>Adresse e-mail (identification et connexion) ;</li>
        <li>Nom d’affichage ;</li>
        <li>Mot de passe, stocké uniquement sous forme de hachage argon2id — jamais en clair ;</li>
        <li>Contenus que vous créez : espaces, dossiers, notes et pièces jointes ;</li>
        <li>
          Données techniques minimales de sécurité (journaux d’événements d’authentification).
        </li>
      </ul>
      <LegalP>Aucune donnée n’est revendue, et aucun traceur publicitaire n’est utilisé.</LegalP>

      <LegalH2>Finalités et base légale</LegalH2>
      <LegalP>
        Vos données sont traitées pour fournir le service (création de compte, authentification,
        édition et partage de notes). La base légale est l’exécution du contrat correspondant aux
        conditions d’utilisation que vous acceptez à l’inscription.
      </LegalP>

      <LegalH2>Durée de conservation</LegalH2>
      <LegalP>
        Vos données sont conservées tant que votre compte est actif. Lorsque vous supprimez votre
        compte, il est immédiatement désactivé (plus aucune connexion possible) puis définitivement
        effacé après une période de grâce de 30 jours. À l’issue de ce délai, les contenus que vous
        avez partagés dans des espaces collaboratifs sont anonymisés (auteur « Utilisateur supprimé
        ») afin de ne pas dégrader le travail des autres membres ; vos espaces personnels et
        fichiers sont supprimés.
      </LegalP>

      <LegalH2>Sécurité</LegalH2>
      <ul style={listStyle}>
        <li>Mots de passe hachés avec argon2id et vérifiés contre les fuites connues (HIBP) ;</li>
        <li>Sessions révocables et communication chiffrée (HTTPS) ;</li>
        <li>Assainissement des contenus (protection contre les injections XSS).</li>
      </ul>

      <LegalH2>Vos droits</LegalH2>
      <LegalP>
        Conformément au RGPD, vous disposez des droits d’accès, de rectification, d’effacement, de
        portabilité et d’opposition. Deux d’entre eux s’exercent directement depuis l’écran « Mon
        compte » :
      </LegalP>
      <ul style={listStyle}>
        <li>
          <strong>Portabilité</strong> : « Exporter mes données » télécharge l’ensemble de vos
          données au format JSON ;
        </li>
        <li>
          <strong>Effacement</strong> : « Supprimer mon compte » lance la procédure de suppression
          décrite ci-dessus.
        </li>
      </ul>
      <LegalP>Vous pouvez également introduire une réclamation auprès de la CNIL (cnil.fr).</LegalP>

      <LegalH2>Cookies</LegalH2>
      <LegalP>
        Memo n’utilise qu’un seul cookie, strictement nécessaire au maintien de votre session : un
        cookie de rafraîchissement <code>refreshToken</code> (httpOnly, Secure, SameSite=Strict).
        Aucun cookie de mesure d’audience ou de publicité n’est déposé.
      </LegalP>

      <LegalH2>Hébergement et transferts</LegalH2>
      <LegalP>
        Les données sont hébergées dans l’Union européenne (Hetzner, Allemagne). Aucun transfert
        hors UE n’est réalisé.
      </LegalP>
    </LegalPage>
  )
}

const listStyle: CSSProperties = {
  fontSize: 14.5,
  lineHeight: 1.7,
  opacity: 0.85,
  margin: '0 0 10px',
  paddingLeft: 22,
}
