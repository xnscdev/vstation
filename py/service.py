import dbus
import dbus.service
import dbus.mainloop.glib
from gi.repository import GLib
import libvirt
import sys
from xml.dom import minidom

class LibvirtException(dbus.DBusException):
    _dbus_error_name = 'com.github.xnscdev.LibvirtException'

class VStation(dbus.service.Object):
    @dbus.service.method(dbus_interface='com.github.xnscdev.VStation',
                         in_signature='', out_signature='as')
    def GetMachines(self):
        try:
            ids = conn.listDomainsID()
            if ids is None:
                raise LibvirtException('Failed to obtain domain ID list')
            machines = []
            for id in ids:
                dom = conn.lookupByID(id)
                if dom is None:
                    raise LibvirtException('Failed to find domain for ID ' + id)
                raw_xml = dom.XMLDesc(0)
                xml = minidom.parseString(raw_xml)
                for g in xml.getElementsByTagName('graphics'):
                    if (g.getAttribute('type') == 'vnc' and
                        g.getAttribute('autoport') == 'no'):
                        machines.append(dom.name())
                        break
            return machines
        except libvirt.libvirtError as e:
            raise LibvirtException(repr(e))

    @dbus.service.method(dbus_interface='com.github.xnscdev.VStation',
                         in_signature='s', out_signature='q')
    def GetVNCPort(self, name):
        try:
            dom = conn.lookupByName(name)
            if dom is None:
                raise LibvirtException('Failed to find domain ' + name)
            raw_xml = dom.XMLDesc(0)
            xml = minidom.parseString(raw_xml)
            for g in xml.getElementsByTagName('graphics'):
                if (g.getAttribute('type') == 'vnc' and
                    g.getAttribute('autoport') == 'no'):
                    return int(g.getAttribute('port'))
        except libvirt.libvirtError as e:
            raise LibvirtException(repr(e))
        raise LibvirtException('Could not find VNC port for domain ' + name)

if __name__ == '__main__':
    try:
        conn = libvirt.open('qemu:///system')
    except libvirt.libvirtError as e:
        print(repr(e), file=sys.stderr)
        exit(1)

    dbus.mainloop.glib.DBusGMainLoop(set_as_default=True)

    session_bus = dbus.SessionBus()
    name = dbus.service.BusName('com.github.xnscdev.VStation', session_bus)
    obj = VStation(session_bus, '/VStation')

    mainloop = GLib.MainLoop()
    mainloop.run()
