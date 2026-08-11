<?php

    class Verify {

        public static function verifySyntax($email) {
            if(!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                return false;
            } else {
                return true;
            }
        }
        
    }