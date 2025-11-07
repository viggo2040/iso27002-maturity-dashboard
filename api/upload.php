
<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
$config = require __DIR__ . '/config.php';
$dataFile = $config['data_file'];
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['error'=>'Method not allowed']); exit; }
if (!empty($config['auth_enabled'])) {
  $pwd = isset($_POST['password']) ? (string)$_POST['password'] : '';
  if ($pwd === '' || $pwd !== (string)$config['auth_password']) { http_response_code(401); echo json_encode(['error'=>'Unauthorized']); exit; }
}
if (!isset($_FILES['file'])) { http_response_code(400); echo json_encode(['error'=>'No file uploaded']); exit; }
$f = $_FILES['file'];
if ($f['error'] !== UPLOAD_ERR_OK) { http_response_code(400); echo json_encode(['error'=>'Upload error','code'=>$f['error']]); exit; }
$ext = strtolower(pathinfo($f['name'], PATHINFO_EXTENSION));
if ($ext !== 'csv') { http_response_code(400); echo json_encode(['error'=>'Only CSV files are accepted']); exit; }
if ($f['size'] > 5*1024*1024) { http_response_code(400); echo json_encode(['error'=>'File too large (max 5MB)']); exit; }
if (!is_uploaded_file($f['tmp_name'])) { http_response_code(400); echo json_encode(['error'=>'Invalid upload']); exit; }
$dir = dirname($dataFile); if (!is_dir($dir)) { @mkdir($dir, 0775, true); }
if (!move_uploaded_file($f['tmp_name'], $dataFile)) { http_response_code(500); echo json_encode(['error'=>'Failed to save file']); exit; }
echo json_encode(['ok'=>true,'file'=>basename($dataFile)]);
