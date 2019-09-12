<?php
ini_set('display_errors', 'On'); 			//SOLO PARA DEPURACION
error_reporting(E_ALL | E_STRICT);
/**************************************************************************
 	PROYECTO: Control de Acceso Aguialarmas
 	MODULO: porteria - ENVIO DE MENSAJES
 	PROGRAMA: mensajes.php
 	- Recibe solicitud de porteria cada 15 segundos (via AJAX).
 	- consulta nuevas visitas por confirmar (recibe via $_GET['opc']='enviarMsj')
	tabla: estadosvisita:
 	  (1, 'Por Autorizar'), (2, 'Leido por Modulo Msj'), (3, 'Msj enviado'),
  	  (4, 'Msj Recibido por Residente'), (5, 'Autorizada'), (6, 'Activa'),
  	  (7, 'Cancelada'), (8, 'Cumplida')

 	- Se devuelven registros en estado = 1, en formato JSON:
 	{'msj':'xxxxx', 'tel':'xxx', 'idVisita': 'xx'}

	- Modifica estados de visita (recibe via $_POST["opc"]='actualizarMsj', $_POST["estado"]='x'), $_POST["idVisita"]='xx'). 
	Puede cambiar a estados 2,3,4
	devuelve JSON {'ok': 'x'}
		-2: 'No existe FK'.
		-1: 'Ya existe PK'.
		 0: 'No ejecuto la consulta'.
	     x: 'Numero de filas afectadas'.

 	MLM. Abr/22/2019
 	ver: 1.0
***************************************************************************/
include("enlaceDB.php");   			//Conecta a la BD $conexion

/*********** MODULO MENSAJES ********************************************/
//caso actualizacion
if (isset($_POST["opc"])){
	if($_POST["opc"] = 'actualizarMsj'){
		$cons = 'UPDATE visita SET estado = '. $_POST["estado"]. ' WHERE idVisita = '.$_POST["idVisita"];

		$reg = actualizar($cons); 
		$arr = array('ok' => $reg);			//Devuelve un numero con el resultado. 	
		echo json_encode($arr);   
	}
}

//Caso consulta
if (isset($_GET['opc'])){
	if ($_GET['opc']== 'enviarMsj'){
		$cons = 'SELECT CONCAT(VST.nombres , " " , VST.apellidos, " solicita ingreso a ", L.nombreLocal, " de " , PC.nombre, " a las " , DATE_FORMAT(V.fechaIngreso, "%H:%i")) AS msj, PER.celular AS tel, V.idVisita FROM visita V JOIN visitante VST ON V.idVisitante = VST.idVisitante JOIN local L ON V.idLocal = L.idLocal JOIN bloque B ON L.idBloque = B.idBloque JOIN puntocontrol PC ON B.idPunto = PC.idPunto JOIN residente R ON R.idLocal = L.idLocal JOIN persona PER ON PER.documPersona = R.documResidente WHERE V.estado = 1';

		$rows = leerRegistro($cons);
	}
}

/***** FUNCIONES DE SERVICIO ***********************************/

/****** LEER REGISTRO   ****************************************
	ejecuta la consulta y devuelve datos en formato JSON
	****************************************************************/
function leerRegistro($cons){
	global $pdo;
	$stmt = $pdo->prepare($cons);
	$stmt->execute(); 

	//Toma todas las filas de la consulta
	$rows = array();
	foreach ($stmt as $r){
		  	$rows["aguialarmas"][] = $r;	  	
	}
	echo json_encode($rows, JSON_UNESCAPED_UNICODE); 
}


/****** ESCRIBIR REGISTRO   ***************************************
	Ejecuta las consultas de prueba e inserción 
	@return: $resultado. 
		 0: 'No ejecuto la consulta'.
	     x: 'Numero de filas afectadas'.
	******************************************************************/
function actualizar($cons){
	global $pdo;
	$resultado = 0;							//Asume que tiene exito al actualizar
	$stmt = $pdo->prepare($cons);
	$stmt->execute();
	$resultado = $stmt->rowCount(); //Registos afectados por la consulta
	return $resultado;
}
/*********************************************************************/
