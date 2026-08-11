<?php

    class Security {

        public static function hash($pass) {
            return $pass = 'e4f'. sha1($pass. 'edf') . 'd4b';
        }
    }