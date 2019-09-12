<?php
ini_set('display_errors', 'On'); 			//SOLO PARA DEPURACION
error_reporting(E_ALL | E_STRICT);
/**************************************************************************
 	PROYECTO: Control de Acceso Aguialarmas
 	MODULO: ADMINISTRADOR
 	PROGRAMA: despachador.php
 	Recibe las solicitudes del cliente (via AJAX) y las
 	ejecuta segun el parametro $_POST["opc"]
 	devuelve datos en formato JSON
 	MLM. sep/19/2019
 	ver: 1.0
***************************************************************************/
include("enlaceDB.php");   			//Conecta a la BD $conexion

/********** OBJETOS GLOBALES***********************************************/
//var_dump($_POST);
	$opcion = $_POST["opc"]; 	//La opcion del menu enviada por ajax desde el cliente
	$cons = "";					//Contendra la consulta SQL a realizar
	$sqlTest = "";				//Consulta para probar la existencia de PK
	$sqlTest1= "";				//Consulta para probar la existencia de FK
	$datos = array();			//Contendra los datos recibidos del cliente

/*********** MODULO DESPACHADOR ********************************************/
//echo $opcion.'++';
switch ($opcion){
/*---------- USUARIO  -----------------------------------------------------*/
	case 'verificarUsuario': //  Si existe usuario y password correctos devuelve datos, sino devuelve -1
		$cons ='SELECT U.idUsuario, U.rol, U.idPunto, P.nombres FROM usuario U JOIN persona P ON U.documUsuario = P.documPersona WHERE U.rol = 3 AND U.username = ? AND U.password = ?';
		$datos[0] = $_POST['userName'];
		$datos[1] = $_POST['password'];

//		echo $datos[0].'--'.$datos[0].'--';
		leerRegistro($cons, $datos);   
		break;

/*---------- PUNTO DE CONTROL  ------------------------------------------------*/
	case 'cargarDatosPunto':
		$cons ='SELECT PC.idPunto, PC.nombre, PC.direccion, PC.documAdmin, TP.descripTipoPunto, TP.descripTipoBloque, TP.descripTipoLocal FROM puntocontrol PC JOIN tipospunto TP ON PC.tipo = TP.idtipoPunto WHERE PC.idPunto = ? AND PC.estadoPunto = 1';
 		$datos[0] = $_POST['idPunto'];
		leerRegistro($cons, $datos);   
		break;





//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@



/* --------- TABLAS AUXILIARES PUNTO ------------------------------------*/
	case 'cargarEstadosVisita':
		$cons ='SELECT * FROM estadosvisita';
		leerRegistro($cons, $datos);   
		break;			

	case 'cargarTiposAutorizacion':
		$cons ='SELECT * FROM tiposautorizacion';
		leerRegistro($cons, $datos);   
		break;			

	case 'cargarListaResidentesTotal':
		$cons ='SELECT R.idResidente, CONCAT(P.nombres, " ", P.apellidos) AS nombre, L.idLocal,  B.idBloque FROM residente R JOIN persona P ON R.documResidente = P.documPersona  JOIN local L ON R.idLocal = L.idLocal JOIN bloque B ON B.idBloque = L.idBloque WHERE B.idPunto = ? ORDER BY nombre';

		$datos[0] = $_POST['idPunto'];
		leerRegistro($cons, $datos);   
		break;			

		//Lee las visitas activas en un punto
	case 'cargarVisitasPunto':
		$cons ='SELECT V.idVisita, V.idLocal, CONCAT(L.nombreLocal, " ", B.nombreBloque) AS nombreLocal, V.idVisitante, CONCAT(VT.nombres, " ", VT.apellidos) As nombres , V.fechaIngreso, V.fechaSalida, V.estado, V.tipo, V.numFicha, V.placaVehiculo, V.documAutoriza FROM visita V JOIN local L ON V.idLocal = L.idLocal JOIN visitante VT ON V.idVisitante = VT.idVisitante JOIN bloque B ON L.idBloque = B.idBloque WHERE V.idLocal IN (SELECT idLocal FROM local WHERE idBloque IN ( SELECT idBloque FROM bloque WHERE idPunto = ?)) AND V.estado < 4 ORDER BY V.numFicha';

 		$datos[0] = $_POST['idPunto'];
		leerRegistro($cons, $datos);   
		break;

		//Lee los detalles de las visitas activas en un punto
	case 'cargarDetallesVisitasPunto':
		$cons ='SELECT V.numFicha, VS.documVisitante, CONCAT(VT.nombres, " ", VT.apellidos) As nombres, V.fechaIngreso, CONCAT(FLOOR(HOUR(TIMEDIFF(fechaIngreso, NOW()))), "H ", MINUTE(TIMEDIFF(fechaIngreso, NOW())), "m") as tiempo, CONCAT(L.nombreLocal, " ", B.nombreBloque) AS nombreLocal, CONCAT(P.nombres, " ", P.apellidos) As autorizo, E.descripEstadoVisita as estado, T.descripTipoAutorizacion AS tipo, V.placaVehiculo FROM visita V JOIN local L ON V.idLocal = L.idLocal JOIN visitante VT ON V.idVisitante = VT.idVisitante JOIN bloque B ON L.idBloque = B.idBloque JOIN estadosvisita E ON V.estado = E.idEstadoVisita JOIN tiposautorizacion T ON V.tipo = T.idTipoAutorizacion JOIN visitante VS ON VS.idVisitante = V.idVisitante JOIN persona P ON P.documPersona = V.documAutoriza WHERE V.idLocal IN (SELECT idLocal FROM local WHERE idBloque IN ( SELECT idBloque FROM bloque WHERE idPunto = ?)) AND V.estado < 4 ORDER BY V.numFicha';

 		$datos[0] = $_POST['idPunto'];
		leerRegistro($cons, $datos);   
		break;

	case 'cargarBloquesPunto':
		$cons ='SELECT idBloque, nombreBloque FROM bloque WHERE idPunto = ?';
 		$datos[0] = $_POST['idPunto'];
		leerRegistro($cons, $datos);   
		break;

	case 'cargarLocalesPunto':
		$cons ='SELECT idLocal, nombreLocal, idBloque FROM local WHERE idBloque IN (SELECT idBloque FROM bloque WHERE idPunto = ?)';
 		$datos[0] = $_POST['idPunto'];
		leerRegistro($cons, $datos);   
		break;


/* --------- VISITANTES ------------------------------------*/
	case 'consultarVisitante':
		$cons ='SELECT idVisitante, documVisitante, nombres, apellidos, placaVehiculo, foto FROM visitante  WHERE documVisitante = ?';
 		$datos[0] = $_POST['documVisitante'];
		leerRegistro($cons, $datos);   
		break;

	case 'consultarVisitantesActivos':
		$cons ='SELECT idVisitante, documVisitante, nombres, apellidos, placaVehiculo, foto FROM visitante  WHERE idVisitante IN (SELECT  DISTINCT idVisitante FROM visita V JOIN local L ON V.idLocal = L.idLocal JOIN bloque B ON L.idBloque = B.idBloque WHERE B.idPunto = ? AND V.estado < 4)';
 		$datos[0] = $_POST['idPunto'];
		leerRegistro($cons, $datos);   
		break;

	case 'guardarDatosVisitante':
		$sqlTest = 'SELECT idVisitante FROM visitante WHERE documVisitante =' . $_POST['documVisitante'];
		$cons ='INSERT INTO visitante (documVisitante, nombres, apellidos, placaVehiculo, foto) VALUES (?, ?, ?, ?, ?)';

 		$datos[0] = $_POST['documVisitante'];
 		$datos[1] = $_POST['nombres'];
 		$datos[2] = $_POST['apellidos'];
 		$datos[3] = $_POST['placaVehiculo'];
 		$datos[4] = $_POST['foto'];
		$reg = actualizar($cons, $datos);  /*Devuelve un numero con el resultado.*/

		$sqlTest = "";	//Limpia consulta de comprobacion
		if( $reg < 0){  /* -1: ya estaba, 0: no se creo, 1: creado*/
			$cons = 'UPDATE visitante SET nombres = ?, apellidos = ?, placaVehiculo = ?, foto = ? WHERE documVisitante = ?';
			$datos = array();  //Limpia datos para reordenar
	 		$datos[0] = $_POST['nombres'];
	 		$datos[1] = $_POST['apellidos'];
	 		$datos[2] = $_POST['placaVehiculo'];
	 		$datos[3] = $_POST['foto'];
	 		$datos[4] = $_POST['documVisitante'];
			$reg = actualizar($cons, $datos); 
		}  
		$arr = array('ok' => $reg);			//Devuelve un numero con el resultado. 1: insertado				
		echo json_encode($arr);   
		break;
	
	case 'consultarAutorizaciones':
		$cons = 'SELECT * FROM autorizacion WHERE estado < 4 AND idLocal = ?';
	 	$datos[0] = $_POST['idLocal'];
		leerRegistro($cons, $datos);   
		break;

	case 'consultarResidentes':
		$cons = 'SELECT R.documResidente as docum, CONCAT(P.nombres, " ", P.apellidos) AS nombres FROM residente R JOIN persona P ON R.documResidente = P.documPersona WHERE R.idLocal = ?';
	 	$datos[0] = $_POST['idLocal'];
		leerRegistro($cons, $datos);   
		break;

	case 'crearRegistroVisita':
		$cons ='INSERT INTO visita (idLocal, idVisitante, fechaIngreso, fechaSalida, estado, tipo, numFicha, placaVehiculo, documAutoriza) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';

		$datos[0] = $_POST['idLocal'];
		$datos[1] = $_POST['idVisitante'];
		$datos[2] = $_POST['fechaIngreso'];
		$datos[3] = $_POST['fechaSalida'];
		$datos[4] = $_POST['estado'];
		$datos[5] = $_POST['tipo'];
		$datos[6] = $_POST['numFicha'];
		$datos[7] = $_POST['placaVehiculo'];
		$datos[8] = $_POST['documAutoriza'];

		$reg = actualizar($cons, $datos);  //Devuelve un numero con el resultado. 1: insertado
		$arr = array('ok' => $reg);						
		echo json_encode($arr);   
		break;

	case 'actualizarRegistroVisita':
		$cons = 'UPDATE visita SET estado = ?, numFicha = ? WHERE idVisita = ?';
		$datos[0] = $_POST['estado'];
		$datos[1] = $_POST['numFicha'];
		$datos[2] = $_POST['idVisita'];
		$reg = actualizar($cons, $datos);   
		$arr = array('ok' => $reg);		//Devuelve un numero con el resultado. 1: modificado			
		echo json_encode($arr);   
		break;

	case 'registrarSalida':
		$cons = 'UPDATE visita SET estado = ?, fechaSalida = ? WHERE idVisita = ?';
		$datos[0] = $_POST['estado'];
		$datos[1] = $_POST['fechaSalida'];
		$datos[2] = $_POST['idVisita'];
		$reg = actualizar($cons, $datos);   
		$arr = array('ok' => $reg);		//Devuelve un numero con el resultado. 1: modificado			
		echo json_encode($arr);   
		break;


/*********** BLOQUE DE CONSULTAS PERIODICAS AL SERVIDOR******************************/
	//Tips enviados al operador activos en esa fecha y hora
	case 'consultarTipsOperador':  
		$cons = 'SELECT T.idTip, T.textoTip FROM tip T JOIN destinostip D ON T.idTip = D.idTip WHERE D.idPunto = ? AND T.estado = 2 AND T.destVigil = 1 AND T.FechaIni <= ? AND T.FechaFin >= ? AND T.horaIni <= ? AND T.horaFin >= ?';
	 	
	 	$datos[0] = $_POST['idPunto'];
	 	$datos[1] = $_POST['fecha'];
	 	$datos[2] = $_POST['fecha'];
	 	$datos[3] = $_POST['hora'];
	 	$datos[4] = $_POST['hora'];
		leerRegistro($cons, $datos);   
		break;

	//Mensajes al operador. se marcan como leidos
	case 'consultarMsjsOperador':  
		$cons = 'SELECT M.idMsj, M.textoMsj FROM mensaje M JOIN destinosmsj D ON M.idMsj = D.idMsj WHERE D.idPunto = ? AND M.estado = 1 AND D.leido = 0';
	 	$datos[0] = $_POST['idPunto'];
		$mensajes = leerRegistro1($cons, $datos); 
	    $datos = array();
		//Marca los mensajes como leidos: PROVISIONAL. Debe marcar al hacer click sobre msj.  
/*	    $cons = 'UPDATE destinosmsj SET leido = 1 WHERE idMsj = ?'; 
	    foreach ($mensajes as $row) {
	    	var_dump($row);
	    	echo "+++";
		    $datos[0] = $row["idMsj"];
			actualizar($cons, $datos);
		}
*/
		echo json_encode($mensajes, JSON_UNESCAPED_UNICODE);
		break;

	case 'marcarMsjLeido':
		$cons = 'UPDATE destinosmsj SET leido = 1 WHERE idMsj = ?';
	 	$datos[0] = $_POST['idMsj'];
		$reg = actualizar($cons, $datos);   
		$arr = array('ok' => $reg);		//Devuelve un numero con el resultado. 1: modificado			
		echo json_encode($arr);   
		break;


}





/***** FUNCIONES DE SERVICIO ***********************************/

/****** LEER REGISTRO   ****************************************
	ejecuta la consulta y devuelve datos en formato JSON
	****************************************************************/
function leerRegistro($cons, $datos){
	$rows = leerRegistro1($cons, $datos);
	echo json_encode($rows, JSON_UNESCAPED_UNICODE); 
}

/****** LEER REGISTRO   ****************************************
	ejecuta la consulta y devuelve datos en array
	****************************************************************/
function leerRegistro1($cons, $datos){
	global $pdo;
	$stmt = $pdo->prepare($cons);

	for ($i = 0; $i < count($datos); $i++) { 
			$stmt->bindValue($i+1, $datos[$i]);
	}

	$stmt->execute(); 

	//Toma todas las filas de la consulta
	$rows = array();
	foreach ($stmt as $r){
		  	$rows[] = $r;	  	
	}

	return $rows;
}


/******* verificarRegistro *******************************************
	Consulta la existencia de un registro en la BD.
	Si lo encuentra devuelve consulta, si no  devuelve 0.
	*****************************************************************/
function verificarRegistro($cons, $datos){
	global $pdo;
	$stmt = $pdo->prepare($cons);
	for ($i = 0; $i < count($datos); $i++) { 
			$stmt->bindValue($i+1, $datos[$i]);
	}
	$stmt->execute();
	$rows = $stmt->fetch(PDO::FETCH_ASSOC);
	return $rows;
	
}

/****** ESCRIBIR REGISTRO   ***************************************
	Ejecuta las consultas de prueba e inserción 
	@return: $resultado. 
		-2: 'No existe FK'.
		-1: 'Ya existe PK'.
		 0: 'No ejecuto la consulta'.
	     x: 'Numero de filas afectadas'.
	******************************************************************/
function actualizar($cons, $datos){
	global $pdo, $sqlTest, $sqlTest1;
	//	$guardar = true;
	$resultado = 0;							//Asume que tiene exito al actualizar
	//PRUEBA PK - NO DEBE EXISTIR
	if(strlen($sqlTest) > 0){				//En caso de probar existencia
		$stmt1 = $pdo->query($sqlTest);
		$rows = $stmt1->fetch(PDO::FETCH_ASSOC);

		if($rows){
			$resultado = -1;				//Si lo encuentra, no puede crear nuevo
		}
	}

	//PRUEBA FK - SI DEBE EXISTIR 			
	if(strlen($sqlTest1) > 0 && $resultado == 0){				//En caso de probar existencia
		$stmt1 = $pdo->query($sqlTest1);
		$rows = $stmt1->fetch(PDO::FETCH_ASSOC);

		if(!$rows){
			$resultado = -2;				//Si NO lo encuentra, no puede crear nuevo
		}
	}

	if($resultado == 0){ 							//Puede ejecutar
		$stmt = $pdo->prepare($cons);
		for ($i = 0; $i < count($datos); $i++) { 
				$stmt->bindValue($i+1, $datos[$i]);
		}

		$stmt->execute();
		$resultado = $stmt->rowCount(); //Registos afectados por la consulta
	}
	return $resultado;
}
/*********************************************************************/
