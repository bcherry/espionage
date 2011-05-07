desc "Run JavaScript test suite"
task :test do
  exec('open test/test.html')
end

directory "pkg"

task :package do
  pkg_name = "espionage.js"
  puts "Building #{pkg_name}..."

  pkg_file = File.open(File.join(File.dirname(__FILE__), "pkg", pkg_name), "w")
  pkg_file.write("/*!\n * espionage.js\n *\n")

  puts "Writing license..."
  license_file = File.open(File.join(File.dirname(__FILE__), "LICENSE"), "r")
  license_file.each_line do |line|
    pkg_file.write(" * #{line}")
  end
  license_file.close

  pkg_file.write(" */\n\n")

  puts "Writing library..."
  ["espionage.js", "mock.js", "spy.js", "stub.js", "time.js"].each do |filename|
    js_file = File.open(File.join(File.dirname(__FILE__), filename), "r")
    pkg_file.write(js_file.read)
    js_file.close
  end

  pkg_file.close

  puts "Done with #{pkg_name}"
end