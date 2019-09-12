/********************************************************
 	PROYECTO: Control de Acceso Aguialarmas
 	MODULO: PORTERIA
 	PROGRAMA: vistaPorteria.js
 	Contiene las funciones de presentacion de formularios
  	MLM. feb/25/2019
 	ver: 1.0
*********************************************************/

class Vista {
	constructor() {

	}
	/********************************************************* 
		Elimina todos los elementos de destino
		*/
	limpiar(destino){
		document.getElementById(destino).innerHTML = "";
	}

	/********************************************************** 
		Carga FORM en DESTINO. confirma que la plantilla exista
		*/
	mostrarPlantilla(form, destino){
		//limpia contenido 
		this.limpiar(destino);
		var template = document.getElementById(form);
		if (template){	//si la plantilla existe...
			var clon = template.content.cloneNode(true);
			document.getElementById(destino).innerHTML = "";
			document.getElementById(destino).appendChild(clon); //inserta
		}
	}

	/********************************************************* 
		Lee valores de los inputs de un formulario
		los devuelve en arreglo, cada item con el id del imput
		*/
	getDatosForm(idForm) {
		let nArray = {};
		let form = document.getElementById(idForm).elements;
		for (let i = 0; i < form.length; i++) {
	       nArray[form[i].id] = form[i].value;
	  	}  
	  	return nArray;
	}

	/********************************************************* 
		Toma el valor de los atributos del objeto (modelo)
		y las muestra en los inputs en pantalla (frmDestino), 
		que tengan el mismo ID del nombre de cada atributo del objeto
		*/
	setDatosForm(modelo){		
		for ( var key in modelo) {
			var x = key ;
			var y = modelo[key];
			if(document.getElementById(x) != null){   //Si existe el elemento
 				document.getElementById(x).value= y; //OJO DEBE SER EL IMPUT DENTRO DEL FORM
			} 
	  	}  
	}

	/************************************************************
		Carga un valor en un input 
		*/
	setDatosInput(input, valor){
		document.getElementById(input).value = valor;
	}

	/***********************************************************
		Despliega una leyenda (titulo) dentro del elemento con id = nombreid 
		*/
	mostrarTitulo(nombreId, titulo){
			document.getElementById(nombreId).innerHTML = titulo;		
	}

	/***********************************************************
		Despliega informacion en la barra inferior 
		*/
	mostrarAviso(aviso){
		document.getElementById('divMsj').innerHTML = aviso;
	}

	/***********************************************************
		Despliega informacion en ventana Modal id="avisoModal" 
		texto en id="msjModal"
		*/
	mostrarAvisoModal(aviso){
		document.getElementById("msjModal").innerHTML = aviso;
		$("#avisoModal").modal();
	}

	/***********************************************************
		Despliega listado inf izq, con lista de visitas en  proceso		
	 	*/
	mostrarColaVisitas(datos){
		// Eliminar filas
		$("#listaVisitas > tbody").html("");
		var txt = '';
		for(var i = 0; i < datos.length; i++){
			if(datos[i]["estado"] <3){
				if(datos[i]["estado"] === 1){  	
					txt += '<tr bgcolor=" #ff6C6C">';	//1: rojo
				}else{	
					txt += '<tr bgcolor=" #FFFF48">';	//2: amarillo
				}
				txt += '<td>' + datos[i]["nombres"] + '</td>';
				txt += '<td>' + datos[i]["nombreLocal"] + '</td>';
				txt += '<td>' + datos[i]["numFicha"] + '</td></tr>';
			}
		}
		$("#listaVisitas > tbody").html(txt);
	}

	/********************************************************* 
		Valida que todos los inputs de un formulario contengan
		datos, segun tipo de input
		devuelte texto con 'ok' o mensaje de error
	*/
	validarDatosForm(form){
		let elements = document.getElementById(form).elements;
		let msj = 'ok';
		for(let i = 0; i < elements.length; i++) { 
			let field_type = elements[i].type.toLowerCase();
			switch(field_type) {
				case "text": 
				case "textarea":
			    case "hidden":
					if(elements[i].value.length == 0)
						msj = 'Los campos deben contener texto'; 
					break;

				case "password": 
					if(elements[i].value.length < 5)
						msj = 'El password debe tener al menos cinco caracteres'; 
					break;
			    case "email":
			    	if(!this.isEmail(elements[i].value))
						msj = 'No es un correo electronico valido'; 
					break;

				case "select-one":
				case "select-multi":
					if(elements[i].selectedIndex < 0)
						msj = 'Debe seleccionar una opción'; 
					break;

				case "number": 
					if(elements[i].value < 1)
						msj = 'Debe digitar un numero positivo, mayor a cero'; 
					break;

				default: 
					break;
			}
	    }
	    return msj;
	}

	isEmail(email) {
		var regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
		return regex.test(email);
	}


	/********************************************************* 
		Despliega una lista en un select.  select: 	id del select a poblar
	 	lista: 	array con pares key-val.
	 	key = nombre del campo en VALOR
		nVal = nombre del campo a desplegar
		*/
	cargarSelect(select, lista, key, nVal){
		$('#'+ select + ' option').remove();
		$('#'+ select).append('<option value= -1>Seleccione...</option>');
		for(let j=0; j< lista.length; j++){
			$('#'+ select).append('<option value= ' + lista[j][key] + ' >'  + lista[j][nVal] + '</option>');
		}
	}

	/* Filtra las visitas para estado = 3 Activas*/
	cargarSelectFichas(lista){
		$('#fichasActivas option').remove();
		$('#fichasActivas').append('<option value= -1>Seleccione...</option>');
		for (let i = 0; i < lista.length; i++) {
			if(listaVisitas[i]['estado'] = 3){
			$('#fichasActivas').append('<option value= ' + i + ' >'  + lista[i]['numFicha'] + '</option>');
			}
	  	}  
	}

	/*********************************************************
		Limpia el contenido del formulario con id= idForm
		*/
	limpiarForm(idForm){
		let form = document.getElementById(idForm).elements;
		for (let i = 0; i < form.length; i++) {
	       document.getElementById(form[i].id).value= '';
	  	}  
	}

	/********************************************************* 
		inserta filas en la tabla idTabla, segun las filas del arreglo datos
		El orden en que estan los elementos de la fila deben ser los mismos
		de las columnas de la tabla. 
		@idTabla: Nombre de la tabla a cargar
		@datos: Array con datos a cargar en @idTabla
		@func: Parte final del nombre de la funcion a ejecutar para editar una fila
			el nombre de la funcion sera: "setDatosForm<func>(i)"
			Toma el indice del elemento como identificador para editar.
		*/
	mostrarDatosTabla(idTabla, datos, func){
		// Eliminar filas
		$(idTabla+" > tbody").html("");
		var txt = '';
		for(var i = 0; i < datos.length; i++){
			txt += '<tr>';
			for ( var key in datos[i]) {
				txt += '<td>' + datos[i][key] + '</td>';
		  	}
		  	if(func.length > 0){  //Genera boton para editar, al final de la fila (opcional)
			  	txt += '<td><div class="btn-group-vertical"><button type="button" class="btn2"';
			  	txt += ' id="btnEditAdmin" onclick="setDatosForm'+ func+'(' + i + ')">';
			  	txt += '<img src="img/logo7.png" ></button></div></td>';  
		  	}
			txt += '</tr>';
		}
		$(idTabla+" > tbody").html(txt);
	}

	/********************************************************* 
		Despliega datos de residentes en tabla para filtrar
		*/
	mostrarResidentesTotal(datos){
		$("#tablaResidentes > tbody").html("");
		var txt = '';
		for(var i = 0; i < datos.length; i++){
			txt += '<tr><td>' + datos[i]['nombre'] + '</td>';
			txt += '<td>' + datos[i]['idLocal'] + '</td>';
			txt += '<td>' + datos[i]['idBloque']+ '</td>';

		  	txt += '<td><button';
		  	txt += ' id="btnAsignarResidente" onclick="asignarResidente(' + i + ')">';
		  	txt += '<img src="img/logo7.png" ></button></td>';  

			txt += '</tr>';
		}
		$("#tablaResidentes > tbody").html(txt);			
	}


	/********************************************************* 
		Despliega datos en tabla autorizaciones
		*/
	mostrarAutorizaciones(datos, tiposAutoriza){
		$("#tblAutorizaciones > tbody").html("");
		var txt = '';
		for(var i = 0; i < datos.length; i++){
			txt += '<tr><td>' + datos[i]['nombreAutoriza'] + '</td>';
			txt += '<td>' + datos[i]['nombreVisit'] + '</td>';
			txt += '<td>' + datos[i]['fechaInicial']+ ' a ' +  datos[i]['fechaFinal'] + '</td>';
			txt += '<td>' + datos[i]['horaIngreso']+ ' a ' +  datos[i]['horaSalida'] + '</td>';
			txt += '<td>' + datos[i]['observaciones'] + '</td>';

			let j = 0;
			while(j< tiposAutoriza.length && tiposAutoriza[j]['idTipoAutorizacion'] != datos[i]['tipo']) j++;
			if(j< tiposAutoriza.length){
				txt += '<td>' + tiposAutoriza[j]['descripTipoAutorizacion'] + '</td>';
			}
			txt += '</tr>';
		}
		$("#tblAutorizaciones > tbody").html(txt);			
	}

	/* Devuelve true si todos los selects estan seleccionados, para poder crear visita +++++++++++++++++
		@estado: int. si != 5, no valida '#autorizado, 
		 siempre valida "bloques" "locales" "tipoAutorizacion"
		*/
	validarSelects(estado){
		let ok = true;

		if($('#bloques').val() < 1 || $('#locales').val() < 1 || $('#tipoAutorizacion').val() < 1) 
			ok = false;

		if(estado == 5 && $('#autorizado').val() < 1) 
			ok = false;

		return ok;
	}

	//Limpia selects #bloques, #locales, #tipoAutorizacion, #autorizado 
	//el input #numFicha y la tabla #tblAutorizaciones 
	limpiarDestino(){
		$('#bloques option').remove();
		$('#locales option').remove();
		$('#tipoAutorizacion option').remove();
		$('#autorizado option').remove();
		document.getElementById('numFicha').value= '';
		$("#tblAutorizaciones > tbody").html("");
		$('#observaciones').val('');
	}

}