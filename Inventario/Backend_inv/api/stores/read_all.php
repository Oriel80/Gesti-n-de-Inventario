<?php
    // api/stores/read_all.php

    header('Access-Control-Allow-Origin: *');
    header('Content-Type: application/json');
    header('Access-Control-Allow-Methods: GET');
    header('Access-Control-Allow-Headers: Access-Control-Allow-Headers, Content-Type, Access-Control-Allow-Methods, Authorization, X-Requested-With');

    require_once __DIR__ . '/../../config/Database.php';
    require_once __DIR__ . '/../../models/Store.php';
    require_once __DIR__ . '/../../utils/response.php';

    $database = new Database();
    $db = $database->getConnection();

    $store = new Store($db);
    $stores = $store->readAll();

    if (!empty($stores)) {
        Response::send(200, true, "Tiendas encontradas correctamente", $stores);
    } else {
        Response::send(201, true, "Tiendas no encontradas", $stores);
    }
    