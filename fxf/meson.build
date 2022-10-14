glib_dep = dependency('glib-2.0', version: '>= 2.52.0')
gio_dep = dependency('gio-2.0', version: '>= 2.52.0')

executable('vstation-fxf', 'vstation-fxf.c', dependencies: [glib_dep, gio_dep],
           install: true, install_mode: ['rwsr-xr-x', 0, 0])
