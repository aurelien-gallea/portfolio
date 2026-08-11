<?php
require_once('./model/ArticleRepository.php');
require_once('./model/Options.php');

class ArticleController 
{
    
    public function __construct (private readonly ArticleRepository $articleRepository) {
    }
    
    function articles() {
        // on affiche les articles par modification la plus récente
        $request = $this->articleRepository->getAllArticlesByRecentContent();

        require('./view/article/articlesView.php');
    }

    function article($id_article) {
        $request = $this->articleRepository->getOneArticle($id_article); //variable utilisé dans la view pour fetch
        $coms = $this->articleRepository->getAllComsOfThisArticle($id_article); //variable utilisé dans la view pour fetch
        $gear = new Options;
        require('./view/article/articleView.php');
       
    }

    function addCommentarie($content, $id_article, $id_user) {
		$date = date('Y/m/d H:i:s');
        $newCom = $this->articleRepository->createCommentarie($content, $id_article, $id_user, $date);
        
        if($newCom === false) {
            throw new Exception("Impossible d'ajouter votre avis pour le moment");
            exit();
            
        } else {
            successMessage('Votre commentaire a été ajouté !');
            redirect('index.php?page=article');
            exit();
        }
    }

    function newArticleForm() {
        require('./view/article/createArticleView.php');    
    }
    function upArticleForm($id_article) {
        
        $request = $this->articleRepository->getOneArticle($id_article);
        require('./view/article/modifArticleView.php');
    }
    function addArticle($title_article, $article, $id_user) {
        // Model
		$date = date('Y/m/d H:i:s');
        $request = $this->articleRepository->createArticle($title_article, $article, $id_user, $date);
        
        if(!$request) {
            throw new Exception("Impossible d'ajouter votre article pour le moment");
            exit();
            
        } else {
            successMessage('Votre article a été ajouté !');
            redirect('index.php?page=articles');
            exit();
        }
    }
    
    function modifyArticle($title_article,$content,$id_article) {
        
        $request = $this->articleRepository->getOneArticle($id_article);
        $upArticle = $this->articleRepository->updateArticle($title_article,$content,$id_article);
        if(!$request || !$upArticle) {
            throw new Exception("Impossible de modifier votre article pour le moment");
            
        } else {
            successMessage('Votre article a été modifié !');
            redirect('index.php?page=article');
            exit();
        }
    }
    function eraseArticle($id_article) {
       
        $request = $this->articleRepository->deleteArticle($id_article);
        
    }
    function eraseCommentarie($id_com) {
        
        $request = $this->articleRepository->deleteCommentarie($id_com);
    }
    function updateCom($newContent, $id_com) {
        
        $request = $this->articleRepository->updateCommentarie($newContent, $id_com);
    }

    
}