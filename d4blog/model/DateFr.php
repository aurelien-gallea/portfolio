<?php

class DateToFr {
    public static function dateFR($date) {
        $dateTimestamp = strtotime($date);
        echo date('d/m/Y à H:i:s', $dateTimestamp); // gmt+1 + 3600 à timestamp, si besoin
    }
}