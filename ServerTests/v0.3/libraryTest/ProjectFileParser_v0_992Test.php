<?php


class ProjectFileParser_v0_992Test extends PHPUnit_Framework_TestCase
{
    public $id = 0;
    public $baseUrl = "http://localhost/html5/rest/v0.3/projects/";
    public $rootPath = "/libraryTest/";
    public $cacheDir = "cache/";
    public $xmlDir = "xml-codes/";
    public $projectsDir = "projects_v0.992/";

    private function getId()
    {
        return $this->id++;
    }

    private function debug($str)
    {
        fwrite(STDERR, print_r($str, TRUE));
    }

    private function prepareCache($cache)
    {
        if(!is_dir($cache))
            mkdir($cache, 0777, true);

        if(!is_dir($cache . "/images"))
            mkdir($cache . "/images", 0777, true);

        if(!is_dir($cache . "/sounds"))
            mkdir($cache . "/sounds", 0777, true);
    }

    private function processProject($projectName, $cache)
    {
        $projectId = $this->getId();
        $projectPath = $this->projectsDir . $projectName;
        $resBaseUrl = $this->baseUrl . $projectId . "/";

        $this->prepareCache($cache);

        $this->copyDir($projectPath ,$cache );
        print_r('copying fiinshed');
        $simpleXML = simplexml_load_file($projectPath . "/code.xml");

        $parser = new ProjectFileParser_v0_992($projectId, $resBaseUrl, $cache, $simpleXML);
        $project = $parser->getProject();

        $this->saveJson($project, $cache);
    }

    private function copyDir($source, $dest, $permissions = 0755)
    {

        print_r('copying '.$source.'to'.$dest);
        // Check for symlinks
        if (is_link($source)) {
            return symlink(readlink($source), $dest);
        }

        // Simple copy for a file
        if (is_file($source)) {
            print_r('copying '.$source);
            return copy($source, $dest);
        }

        // Make destination directory
        if (!is_dir($dest)) {
            mkdir($dest, $permissions);
        }

        // Loop through the folder
        $dir = dir($source);
        while (false !== $entry = $dir->read()) {
            // Skip pointers
            if ($entry == '.' || $entry == '..') {
                continue;
            }

            // Deep copy directories
            $this->copyDir("$source/$entry", "$dest/$entry", $permissions);
        }

        // Clean up
        $dir->close();
        return true;
    }

    private function saveJson($project, $cacheDir)
    {
        if(!is_dir($cacheDir))
            mkdir($cacheDir, 0777, true);

        $project_json = json_encode($project);
        $filePath = $cacheDir . "code.json";
        $fp = fopen($filePath, "w+");
        fwrite($fp, $project_json);
        fclose($fp);
    }

    private function checkJSON($projectName, $cache)
    {
        $projectPath = $this->projectsDir . $projectName;

        // XML
        $xml = simplexml_load_file($projectPath . "/code.xml");

        // JSON
        $empty = "{}";
        $json_empty = json_decode($empty);

        $json_string = file_get_contents($cache . "code.json");
        $this->assertNotEquals($empty, $json_empty, "code.json is empty");

        $json_result = json_decode($json_string);
        $this->assertNotEquals($json_empty, $json_result, "json_result is empty");
        // check existence
        $this->assertTrue(isset($json_result->id), "json: id is missing");
        $this->assertTrue(isset($json_result->header), "json: header is missing");
        $this->assertTrue(isset($json_result->resourceBaseUrl), "json: resourceBaseUrl is missing");
        $this->assertTrue(isset($json_result->images), "json: images is missing");
        $this->assertTrue(isset($json_result->sounds), "json: sounds is missing");
        $this->assertTrue(isset($json_result->variables), "json: variables is missing");
        $this->assertTrue(isset($json_result->lists), "json: lists is missing");
        $this->assertTrue(isset($json_result->broadcasts), "json: broadcasts is missing");

        $this->assertNotEquals($json_empty, $json_result->header, "json: header is empty");

        // check validity
        $expBaseUrl = "/html5/rest/v0.3/projects/" . $json_result->id . "/";
        $this->checkHeader($xml->header, $json_result->header);
       // $this->checkBackground($xml->objectList[0]->object, $json_result->background);
        //$this->checkSprites($json_empty, $json_empty);
        $this->checkImages($xml->objectList, $json_result->images);
        $this->checkSounds($json_empty, $json_empty);
        $this->checkGlobalVariables($xml->data[0]->programVariableList[0], $json_result->variables);
        $this->checkGlobalLists($xml->data[0]->programListOfLists[0], $json_result->lists);
        $this->checkBroadcasts($json_empty, $json_empty);
    }




    private function checkScenes($xml_scenes, json){

    }


    private function checkScene($xml_scene, json){

    }

    private function checkHeader($xml_header, $json)
    {
        // check existence
        $this->assertTrue(isset($json->languageVersion), "json: languageVersion is missing");
        $this->assertTrue(isset($json->description), "json: description is missing");
        $this->assertTrue(isset($json->title), "json: title is missing");
        $this->assertTrue(isset($json->url), "json: url is missing");
        $this->assertTrue(isset($json->author), "json: author is missing");
        $this->assertTrue(isset($json->device->screenHeight), "json: device->screenHeight is missing");
        $this->assertTrue(isset($json->device->screenMode), "json: device->screenMode is missing");
        $this->assertTrue(isset($json->device->screenWidth), "json: device->screenWidth is missing");

        // check validity
        $expected = (string)$xml_header->catrobatLanguageVersion[0];
        $actual = (string)$json->languageVersion;
        $this->assertEquals($expected, $actual, "catrobatLanguageVersion <-> languageVersion : FAILED");

        $expected = (string)$xml_header->description[0];
        $actual = (string)$json->description;
        $this->assertEquals($expected, $actual, "description <-> description : FAILED");

        $expected = (string)$xml_header->programName[0];
        $actual = (string)$json->title;
        $this->assertEquals($expected, $actual, "programName <-> title : FAILED");

        $expected = (string)$xml_header->url[0];
        $actual = (string)$json->url;
        $this->assertEquals($expected, $actual, "url <-> url : FAILED");

        $expected = (string)$xml_header->userHandle[0];
        $actual = (string)$json->author;
        $this->assertEquals($expected, $actual, "userHandle <-> author : FAILED");

        $expected = (string)$xml_header->screenHeight[0];
        $actual = (string)$json->device->screenHeight;
        $this->assertEquals($expected, $actual, "screenHeight <-> screenHeight : FAILED");

        $expected = (string)$xml_header->screenMode[0];
        $actual = (string)$json->device->screenMode;
        $this->assertEquals($expected, $actual, "screenMode <-> screenMode : FAILED");

        $expected = (string)$xml_header->screenWidth[0];
        $actual = (string)$json->device->screenWidth;
        $this->assertEquals($expected, $actual, "screenWidth <-> screenWidth : FAILED");
    }

    private function checkBackground($xml_bg, $json)
    {
        // check existence
        $this->assertTrue(isset($json->id), "json: id is missing");
        $this->assertTrue(isset($json->name), "json: name is missing");
        $this->assertTrue(isset($json->looks), "json: looks is missing");
        $this->assertTrue(isset($json->sounds), "json: sounds is missing");
        $this->assertTrue(isset($json->variables), "json: variables is missing");
        $this->assertTrue(isset($json->lists), "json: lists is missing");
        $this->assertTrue(isset($json->scripts), "json: scripts is missing");
        $this->assertTrue(isset($json->userScripts), "json: userScripts is missing");

        // check validity
        $this->assertContains("s", $json->id);

        $expected = (string)$xml_bg['name'];
        $actual = (string)$json->name;
        $this->assertEquals($expected, $actual, "bg name <-> name != 'Background' : FAILED");

        $expected = count($xml_bg->lookList[0]);
        $actual = count($json->looks);
        $this->assertEquals($expected, $actual, "lookList <-> looks -> LENGTH : FAILED");

        $expected = count($xml_bg->soundList[0]);
        $actual = count($json->sounds);
        $this->assertEquals($expected, $actual, "lookList <-> looks -> LENGTH : FAILED");

//    if(count($xml_bg->scriptList[0]) > 0)
//    {
//      $expected = count($xml_bg->scriptList[0]->script[0]->brickList[0]);
//      echo $expected . " vs. ";
//      $actual = count($json->bricks->bricks);
//      echo $actual;
//    }

    }

    private function checkSprites($xml_sprites, $json)
    {

    }

    private function checkImages($objectList, $json)
    {
        $images = [];
        foreach($json as $image)
        {
            $this->assertTrue(isset($image->id), "json: image id is missing");
            $this->assertTrue(isset($image->url), "json: image url is missing");
            $this->assertTrue(isset($image->size), "json: image size is missing");
            $url = str_replace("images/", "", $image->url);
            array_push($images, $url);
        }

        foreach($objectList as $object)
        {
            $lookList = $object->lookList[0];
            foreach($lookList as $look)
            {
                $url = $look->fileName;
                $this->assertTrue(in_array($url, $images), "json: " . $url . " not found");
            }
        }
    }

    private function checkSounds($xml_sounds, $json)
    {
        $sounds = [];
        foreach($json as $sound)
        {
            $this->assertTrue(isset($sound->id), "json: sound id is missing");
            $this->assertTrue(isset($sound->url), "json: sound url is missing");
            $this->assertTrue(isset($sound->size), "json: sound size is missing");
            $url = str_replace("sounds/", "", $sound->url);
            array_push($sounds, $url);
        }

        foreach($xml_sounds as $object)
        {
            $soundList = $object->soundList[0];
            foreach($soundList as $sound)
            {
                $url = $sound->fileName;
                $this->assertTrue(in_array($url, $sounds), "json: " . $url . " not found");
            }
        }
    }

    private function checkGlobalVariables($xml_vars, $json)
    {
        $expected = count($xml_vars);
        $actual = count($json);
        $this->assertEquals($expected, $actual, "global vars count : FAILED");
    }

    private function checkGlobalLists($xml_lists, $json)
    {
        $expected = count($xml_lists);
        $actual = count($json);
        $this->assertNotEquals($expected, $actual, "global lists count : FAILED");
    }

    private function checkBroadcasts($xml_bc, $json)
    {

    }

    public function setUp()
    {
        $this->rootPath = getcwd() . $this->rootPath;
        $this->cacheDir = $this->rootPath . $this->cacheDir;
        $this->xmlDir = $this->rootPath . $this->xmlDir;
        $this->projectsDir = $this->rootPath . $this->projectsDir;
    }

    public function testTestProgram()
    {
        $projectName = "TestProgram";
        $cache = $this->cacheDir . __FUNCTION__ . "/";

        $this->processProject($projectName, $cache);
        $this->checkJSON($projectName, $cache);
    }





}