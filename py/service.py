import dbus
import dbus.service
import dbus.mainloop.glib
from gi.repository import GLib

class VStation(dbus.service.Object):
    @dbus.service.method(dbus_interface='com.github.xnscdev.VStation',
                         in_signature='', out_signature='a(ss)')
    def GetMachines(self):
        return []

if __name__ == '__main__':
    dbus.mainloop.glib.DBusGMainLoop(set_as_default=True)

    session_bus = dbus.SessionBus()
    name = dbus.service.BusName('com.github.xnscdev.VStation', session_bus)
    obj = VStation(session_bus, '/VStation')

    mainloop = GLib.MainLoop()
    mainloop.run()
