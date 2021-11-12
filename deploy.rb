#!/usr/bin/env ruby

$ip_address = ""
$package_name = "0Nf3BPEsam"
$application_id = $package_name + "." + "native2"
$project_name = "Native Player"

require "open3"
require "ostruct"
require "io/console"
require "fileutils"

begin
	require "Win32API"

	def get_char()
		Win32API.new("crtdll", "_getch", [], "L").Call
	end
rescue LoadError
	def get_char()
		state = `stty -g`
		`stty raw -echo -icanon isig`

		STDIN.getc.chr
	ensure
		`stty #{state}`
	end
end

$windows = false
$linux = false
$solaris = false
$osx = false
$unsupported_os = false

case RbConfig::CONFIG["host_os"]
	when /mswin|windows|mingw/i
		$operating_system = "windows"
		$windows = true
	when /linux|arch/i
		$operating_system = "linux"
		$linux = true
	when /sunos|solaris/i
		$operating_system = "solaris"
		$solaris = true
		$unsupported_os = true
	when /darwin/i
		$operating_system = "osx"
		$osx = true
	else
		$operating_system = "unknown"
		$unsupported_os = true
end

def join_paths(*args)
	if args.nil? or args.length == 0
		return nil
	end

	path = nil

	args.each do |arg|
		if path.to_s.empty?
			path = arg
		else
			path = File.join(path, arg)
		end
	end

	if $windows
		path = path.gsub(File::SEPARATOR, File::ALT_SEPARATOR || File::SEPARATOR)
	end

	return path
end

$app_dir = ""
$output_dir = "temp"
$wgt = $project_name + ".wgt"
$wgt_formatted = $wgt.gsub(/[ \t]+/, "")
$scripts_directory_path = "scripts"
$resources_directory_path = "resources"
$debug_directory_path = "Debug"
$currentbin_directory_path = "CurrentBin"
$subs_directory_path = "subs"
$readme_directory_path = "readme"
$output_wgt_path = join_paths($output_dir, $wgt);

if File.file?($wgt)
	FileUtils.remove_file($wgt)
end

FileUtils.mkdir_p($output_dir)
FileUtils.mkdir_p(join_paths($output_dir, $currentbin_directory_path))

FileUtils.copy(Dir.glob(join_paths($app_dir, "*.xml")), $output_dir)
FileUtils.copy(Dir.glob(join_paths($app_dir, "*.html")), $output_dir)
FileUtils.copy(Dir.glob(join_paths($app_dir, "*.png")), $output_dir)
FileUtils.copy(Dir.glob(join_paths($app_dir, $debug_directory_path, "*.nmf")), join_paths($output_dir, $currentbin_directory_path))
FileUtils.copy(Dir.glob(join_paths($app_dir, $debug_directory_path, "*armv7.nexe")), join_paths($output_dir, $currentbin_directory_path))
FileUtils.copy_entry(join_paths($app_dir, $resources_directory_path), join_paths($output_dir, $resources_directory_path), true)
FileUtils.copy_entry(join_paths($app_dir, $scripts_directory_path), join_paths($output_dir, $scripts_directory_path), true)
FileUtils.copy_entry(join_paths($app_dir, $subs_directory_path), join_paths($output_dir, $subs_directory_path), true)
FileUtils.copy_entry(join_paths($app_dir, $readme_directory_path), join_paths($output_dir, $readme_directory_path), true)

system("tizen package --type wgt -- " + $output_dir)

$target = ""

if !$ip_address.to_s.empty?
	$target = " -s " + $ip_address + ":26101 "
end

if File.file?($output_wgt_path)
	FileUtils.move($output_wgt_path, $wgt_formatted)

	if File.directory?($output_dir)
		FileUtils.remove_dir($output_dir);
	end

	system("sdb start-server")

	if !$ip_address.to_s.empty?
		system("sdb disconnect")
		system("sdb connect " + $ip_address + ":26101")
	end

	system("sdb " + $target + " shell \"0 rmfile any_string\"")
	system("tizen uninstall " + $target + " -p " + $application_id)
	system("sdb " + $target + " shell \"0 rmfile any_string\"")
	system("tizen install " + $target + " -n " + $wgt_formatted)
	system("tizen run " + $target + " -p " + $application_id)
end
