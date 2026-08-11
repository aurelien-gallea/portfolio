<?php
require_once('./model/ArticleRepository.php');
require_once('./model/ProjectRepository.php');
require_once('./model/ProfileRepository.php');
require_once('./model/UsersRepository.php');
require_once('./model/Options.php');


class ProfileController  {
    
    public function __construct(private readonly ProfileRepository $profileRepository) {}
    
    function getMyContent($id_user) {
        $user = $this->profileRepository->getAllInfosFromTable(UsersRepository::TABLE_NAME, $id_user);
        $projects = $this->profileRepository->getAllContentFromUser(ProjectRepository::TABLE_NAME, $id_user);
        $articles = $this->profileRepository->getAllContentFromUser(ArticleRepository::TABLE_ART, $id_user);
        $commentaries = $this->profileRepository->getAllContentFromUser(ArticleRepository::TABLE_COM, $id_user);

        require('./view/profile/profileView.php');
    }
}