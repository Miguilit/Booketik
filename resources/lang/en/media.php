<?php

declare(strict_types=1);

/*
 | Storage and delivery wording for the media layer.
 | Other panel languages fall back to this file.
 */

return array (
  'title' => 'Storage and delivery',
  'menu' => 'Storage',
  'description' => 'Where files are kept, and who hands them to visitors.',
  'hint' => 
  array (
    'title' => 'Switching provider is safe',
    'body' => 'Affects new uploads only. To move existing files run:',
  ),
  'providers' => 
  array (
    'heading' => 'Where files are kept',
    'active' => 'In use',
    'configured' => 'Ready',
    'not_configured' => 'Not set up',
    'missing' => 'Missing: :keys',
    'activate' => 'Use this one',
    'verify' => 'Test the connection',
    'verified' => 'Wrote a file to :bucket and read it back.',
    'readback_failed' => 'Test file came back different.',
    'adapter_missing' => 'Run: composer require league/flysystem-aws-s3-v3',
    'requirements_missing' => 'Needs composer require league/flysystem-aws-s3-v3',
    'no_public_url' => 
    array (
      'local' => 'Local root must be public/storage.',
      's3' => 'No public URL. Set :env or add a CDN.',
      'r2' => 'No public URL. Enable the r2.dev URL or a custom domain and set :env.',
      'spaces' => 'No public URL. Set :env or add a CDN.',
      'b2' => 'No public URL. Set :env or add a CDN.',
      'wasabi' => 'No public URL. Set :env or add a CDN.',
      'gcs' => 'No public URL. Set :env or add a CDN.',
      'bunny_storage' => 'No public URL. Link a Pull Zone and set :env.',
      'minio' => 'No public URL. Set :env.',
    ),
    'bad_public_url' => ':env must start with https://',
    'unreachable' => 'No public URL',
    'local_label' => 'This server',
    'local_ok' => 'Served from public/storage.',
    'no_link' => 'Local root must be inside public/.',
    'private_supported' => 'Can hold protected files',
    'private_unsupported' => 'No private files',
    'signed_supported' => 'Can sign links that expire',
    'files' => 'Files',
    'size' => 'Size',
    'disk' => 'Disk',
  ),
  'cdn' => 
  array (
    'heading' => 'Who serves them',
    'hint_title' => 'A network stores nothing',
    'hint_body' => 'Caches files from storage. Nothing is moved.',
    'origin_label' => 'No network',
    'origin_ok' => 'Files are served straight from storage.',
    'custom_label' => 'Another network',
    'activate' => 'Use this one',
    'verify' => 'Check it is in front',
    'verified' => 'Fetched :url through the network.',
    'purge' => 'Clear the cache',
    'purged' => 'Told the network to forget :count file(s).',
    'purge_partial' => ':count file(s) could not be cleared.',
    'purge_unconfigured' => 'This network has no credentials for clearing its cache.',
    'no_purge' => 'This network cannot clear its cache from here.',
    'invalidating' => 'Invalidating :count path(s).',
    'nothing_to_purge' => 'Nothing to clear.',
    'no_url' => 'This network has no hostname set.',
    'bad_status' => 'The network answered :status for :url.',
    'not_proxied' => 'Not served by :vendor (missing :header header).',
    'hostname' => 'Hostname',
    'hostname_hint' => 'Overrides the .env value.',
    'signed' => 'Can sign links that expire',
    'purge_supported' => 'Can clear its cache',
  ),
  'options' => 
  array (
    'heading' => 'Rules for uploads',
    'visibility' => 'New uploads are',
    'max_kilobytes' => 'Largest upload (kB)',
    'max_kilobytes_hint' => 'Cannot exceed PHP/web server limits.',
    'private_minutes' => 'A private link lasts (minutes)',
    'quota' => 'Storage per workspace (MB)',
    'quota_hint' => '0 = no limit.',
    'derivatives' => 'Make resized copies of images',
    'derivatives_hint' => 'Smaller copies for phones.',
    'save' => 'Save',
    'saved' => 'Saved.',
  ),
);
