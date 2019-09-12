/********************************************************
 	PROYECTO: Control de Acceso Aguialarmas
 	MODULO PORTERIA
 	modeloPorteria.js
 	Contiene las Clases del modelo de datos
 	MLM. feb/25/2019
 	ver: 1.0
 *********************************************************/
//Clase con metodos globales 
class SuperClase{
	constructor(){}
	//+++++++ Toma los valores de DATOS y los carga en las correspondientes propiedades del objeto
	setData(datos){
		for ( var nomAtrib in datos) {
			this[nomAtrib] = datos[nomAtrib];
	  	}  
	}
}

class Usuario extends SuperClase{
	constructor(usuario, password) {
		super();		
		this.userName = usuario;
		this.password = password;
		this.nombres = '';
		this.rol = 0;
	}

	//+++++++ Devuelve un array con las propiedades del objeto, menos el password
	getData(){
	 	let nArray = {
	 		'userName': this.userName, 
	 		'nombre': this.nombre, 
	 		'rol': this.rol, 
	 		'password': this.password
	 	};
	  return nArray;
	}
}

/***********************************************************/
class PuntoControl  extends SuperClase{
	constructor(){
		super();		
		this.idPunto = -1;
		this.nombre = "";
		this.direccion = "";
		this.descripTipoPunto = "";
		this.descripTipoBloque = "";
		this.descripTipoLocal = "";
		this.documAdmin = 0;
	}

	getData(){
	 	let nArray = {
	 		'idPunto': this.idPunto, 
	 		'nombre': this.nombre, 
	 		'direccion': this.direccion, 
	 		'descripTipoPunto': this.descripTipoPunto,
	 		'descripTipoBloque': this.descripTipoBloque, 
	 		'descripTipoLocal': this.descripTipoLocal, 
	 		'documAdmin': this.documAdmin
	 	};
	  return nArray;
	}
	
}

/***********************************************************/
class Visita  extends SuperClase{
	constructor(){
		super();
		this.idVisita = 0;		
		this.idVisitante = 0;
		this.fechaIngreso = '';
		this.fechaSalida = '';
		this.estado = 0;
		this.tipo = 0;
		this.numFicha = '';
		this.placaVehiculo = '';
	}

	getData(){
	 	let nArray = {
	 		'idVisita': this.idVisita,
	 		'idVisitante': this.idVisitante, 
	 		'fechaIngreso': this.fechaIngreso, 
	 		'fechaSalida': this.fechaSalida, 
	 		'estado': this.estado,
	 		'tipo': this.tipo, 
	 		'numFicha': this.numFicha, 
	 		'placaVehiculo': this.placaVehiculo
	 	};
	  return nArray;
	}


}

/***********************************************************/
class Visitante  extends SuperClase{
	constructor(){
		super();		
		/*this.idVisitante = 0;*/
		this.documVisitante = 0;
		this.nombres = '';
		this.apellidos = '';
		this.foto = '';
	}

	getData(){
	 	let nArray = {
	 		'idVisitante': this.idVisitante, 
	 		'documVisitante': this.documVisitante, 
	 		'nombres': this.nombres, 
	 		'apellidos': this.apellidos,
	 		'foto': this.foto
	 	};
	  return nArray;
	}

}