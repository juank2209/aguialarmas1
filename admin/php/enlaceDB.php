<?php
/********************************************************
 	PROYECTO: Control de Acceso Aguialarmas
 	MODULO: Operador
 	PROGRAMA: enlaceDB.php
 	Realiza la conexion a la BD via PDO
 	Es utilizado por DESPACHADOR.PHP
 	sep/19/2018
*********************************************************/
//PDO
/**************************************************************************
 	PROYECTO: Control de Acceso Aguialarmas
 	MODULO: ADMINISTRADOR
 	PROGRAMA: enlaceDB.php
 	Realiza la conexion a la Base de Datos
 	MLM. sep/19/2018
 	ver: 1.0
***************************************************************************/

$host = 'localhost';  
$db   = 'aguialarmas';
$user = 'root';
$pass = '';


$charset = 'utf8';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];
try {
     $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
     throw new \PDOException($e->getMessage(), (int)$e->getCode());
}

?>