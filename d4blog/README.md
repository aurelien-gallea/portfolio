# Projet_Passerelle_2

But : création d'un site type blog avec stockage du contenu dans une base de données SQL. Et gestion des permissions utilisateurs.

Technologies : *PHP JS html css Bootstrap5 SQL docker *

Nous utiliserons une architecture **MVC POO**.

Sujet : Diablo 4.

# Contenu:

## Projets:
Les Projets sur notre site représente les grosses actualités vis a vis du jeux.
- une image 
- peuvent être modifiés ou supprimés par un administrateur
- système de like
- Uniquement créé par un administrateur

## Articles:
- peuvent être écrit par les utilisateurs connectés.
- uniquement les auteurs/admins peuvent éditer ou supprimer un article.
- possèdent des commentaires.
- le nombre de commentaires est affiché.

## Commentaires :
- tout utilisateur connecté peut poster un commentaire.
- les commentaires peuvent être modifiés/supprimés par leur auteur et les admins.
- limite à 1024 caractères.
- le nombre de caractères restants s'affiche lors de la rédactions d'un commentaire.

## Gestion utilisateurs (admin) :
- gestion des droits
- suppression d'un utilisateur
- suppression d'un utilisateur et de ses contributions 

## Profil :
- accès au contributions
- scores dépendant de ses contributions (affiché également dans le liseré sous le header, si connecté)
- modification de l'adresse mail et du MDP


### axes d'améliorations :

- réinitialisation de mdp: envoie d'un mail automatique avec lien.
- compteur de vues.
- ajout de frameworks côté front voire coté back.
- en fait il y a tellements de possibilités que c'est difficile de les citer.
- Forcer l'usage de mot de passe plus sécurisé


### questions en suspens :

- affichage des cartes sociales (s'affichent sur dnschecker) ...
- gestion du .htaccess en mvc 
- recuperer les scripts bootstrap dans vendor ... 






