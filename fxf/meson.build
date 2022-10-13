gnome = import('gnome')

deps = [
  dependency('glib-2.0', version: '>= 2.52.0'),
  dependency('gobject-2.0', version: '>= 2.52.0'),
  dependency('gtk4')
]

res = gnome.compile_resources('vstation-resources', 'vstation.gresource.xml',
                              c_name: 'vstation')

src = [
  'app.vala',
  'main.vala',
  'window.vala',
  res
]

executable('vstation-fxf-gui', src, dependencies: deps, install: true,
           install_mode: ['rwsr-xr-x', 0, 0])
