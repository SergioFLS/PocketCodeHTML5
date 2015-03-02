<?php

  abstract class BaseView {
  
    const GZIP_SUPPORTED = true;	//this const is used for debugging if there is an configuration error
	private $request;
	
    public function __construct($request) {
      $this->request = $request;

    }

    public function render($outputObject) {
	
      $responseStatusCode = $this->getResponseSatusCode($outputObject);
      
	  ob_start();	//nested buffers to calculate content length
	  
	  //init output buffer
	  //if !isset($_SERVER["HTTP_ACCEPT_ENCODING"]) we suppose SPDY support (Firefox) and therefore gzip support
	  if ((isset($_SERVER["HTTP_ACCEPT_ENCODING"]) && !(strpos($_SERVER["HTTP_ACCEPT_ENCODING"], "gzip") === false) || !isset($_SERVER["HTTP_ACCEPT_ENCODING"])) && extension_loaded("zlib") && self::GZIP_SUPPORTED) {
	    ini_set('zlib.output_compression_level', 6);
        ob_start('ob_gzhandler'); 
	  }
	  else {
	    ob_start();
      }
	  
	  //add jsonp call init string if required: begin
	  if (isset($this->request->jsonpCallbackFunction))
	    echo $this->request->jsonpCallbackFunction."('";
	  //handle individual request
      try {
	    $this->writeResponseString($outputObject);
      }
	  catch(Exception $e) {
	    $outputObject = new ExceptionDto("UnhandledException", $e->getMessage(), $e->getCode(), $e->getFile(), $e->getLine());
	    $this->writeResponseString($outputObject);
      }
	
	  //add jsonp call end string if required: end + responseStatusCode
      //a jsonp request will always return a status code 200 (=default) in the HTML header to avoid onLoad error in <script> tag
      //instead: the status code is passed as a 2nd argument to the callback function
      if (isset($this->request->jsonpCallbackFunction)) {
	    echo "', " . $responseStatusCode . ");";
      }
      else  //default request: write to header
        http_response_code($responseStatusCode);
	
	  //write nested buffer to calculate length + set headers
	  ob_end_flush();
	  $this->writeResponseHeader($outputObject);

	  //write response
	  ob_end_flush();
    }
    
	abstract function writeResponseString($outputObject);
	
	private function writeResponseHeader($outputObject) {

      if (isset($_SERVER["HTTP_ACCEPT_ENCODING"]) && !(strpos($_SERVER["HTTP_ACCEPT_ENCODING"], "gzip") === false) && extension_loaded('zlib') && self::GZIP_SUPPORTED)
	    header("Content-Encoding: gzip");

      if (isset($this->request->jsonpCallbackFunction)) {
        header("Content-Type: application/javascript; charset=utf-8");
      }
	  else {
        header("Content-Type: " . $this->request->responseType . "; charset=utf-8");
	  }

      //get response size
	  $length = ob_get_length();
	  //set response header
	  header("Content-Length: ".$length);
	  
	}
	
    private function getResponseSatusCode($outputObject) {
        
	  //set return status code
      $statusCode = 200;
      
      if (get_class($outputObject) === "ExceptionDto") {
	    switch ($outputObject->type) {
	      case 'ServiceNotImplementedException':
  		    //NOT IMPLEMENTED
		    $statusCode = 501;
		    break;
		  
		  case 'ServicePathViolationException':
  		    //NOT FOUND
		    $statusCode = 404;
		    break;
		  
  		  case 'ServiceMethodNotImplementedException':
  	  	    //NOT FOUND
		    $statusCode = 404;
		    break;
		  
		  default:    //FileParserException, UnhandledException
  		    //INTERNAL server ERROR
		    $statusCode = 500;

	    }
      }
      
      return $statusCode;
    }
    
  }

?>