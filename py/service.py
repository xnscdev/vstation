import dbus
import dbus.service
import dbus.mainloop.glib
from gi.repository import GLib
import libvirt
import subprocess
import sys
from tabulate import tabulate
import time
from xml.dom import minidom

next_port = 11624

def get_port():
    global next_port
    port = next_port;
    next_port += 1;
    return port

class LibvirtException(dbus.DBusException):
    _dbus_error_name = 'com.github.xnscdev.LibvirtException'

class WebSocketException(dbus.DBusException):
    _dbus_error_name = 'com.github.xnscdev.WebSocketException'

class VStation(dbus.service.Object):
    @dbus.service.method(dbus_interface='com.github.xnscdev.VStation',
                         in_signature='', out_signature='as')
    def GetMachines(self):
        m = []
        for name in machines:
            m.append(name)
        return m

    @dbus.service.method(dbus_interface='com.github.xnscdev.VStation',
                         in_signature='s', out_signature='')
    def StartMachine(self, name):
        try:
            dom = conn.lookupByName(name)
            if dom.state()[0] == libvirt.VIR_DOMAIN_SHUTOFF:
                if dom.create() == -1:
                    raise LibvirtException('Failed to start machine')
            elif dom.state()[0] != libvirt.VIR_DOMAIN_RUNNING:
                raise LibvirtException('Machine is in unknown state')
        except libvirt.libvirtError as e:
            raise LibvirtException(repr(e))

    @dbus.service.method(dbus_interface='com.github.xnscdev.VStation',
                         in_signature='s', out_signature='q')
    def SetupConnection(self, name):
        try:
            desc = machines[name]
            if not desc['ws']:
                ws = get_port()
                args = [
                    sys.executable,
                    '-m',
                    'websockify',
                    str(ws),
                    'localhost:' + str(desc['vnc'])
                ]
                try:
                    p = subprocess.Popen(args, stderr=subprocess.PIPE)
                except OSError:
                    raise LibvirtException('Failed to setup websockify')

                timeout = 5
                timeout_start = time.time()
                while time.time() < timeout_start + timeout:
                    line = p.stderr.readline()
                    if line and 'proxying' in str(line):
                        break
                if time.time() >= timeout_start + timeout:
                    raise WebSocketException('Timeout in connecting to socket')
                desc['process'] = p
                desc['ws'] = ws
            return desc['ws']
        except KeyError:
            raise LibvirtException('No machine found with name ' + name)

if __name__ == '__main__':
    try:
        print('Connecting to hypervisor...')
        conn = libvirt.open('qemu:///system')

        print('Querying available machines...')
        names = conn.listDefinedDomains()
        if names is None:
            raise LibvirtException('Failed to obtain domain name list')
        ids = conn.listDomainsID()
        if ids is None:
            raise LibvirtException('Failed to obtain domain ID list')
        for id in ids:
            dom = conn.lookupByID(id)
            names.append(dom.name())

        machines = {}
        for name in names:
            dom = conn.lookupByName(name)
            raw_xml = dom.XMLDesc(0)
            xml = minidom.parseString(raw_xml)
            for g in xml.getElementsByTagName('graphics'):
                if (g.getAttribute('type') == 'vnc' and
                    g.getAttribute('autoport') == 'no'):
                    port = int(g.getAttribute('port'))
                    machines[name] = {
                        'vnc': port,
                        'ws': None,
                        'process': None
                    }
                    break

        print('Found machines:')
        m = []
        for name, desc in machines.items():
            m.append((name, desc['vnc']))
        print(tabulate(m, headers=['Name', 'Port']))
    except libvirt.libvirtError as e:
        print(repr(e), file=sys.stderr)
        exit(1)

    dbus.mainloop.glib.DBusGMainLoop(set_as_default=True)

    session_bus = dbus.SessionBus()
    name = dbus.service.BusName('com.github.xnscdev.VStation', session_bus)
    obj = VStation(session_bus, '/VStation')

    mainloop = GLib.MainLoop()
    mainloop.run()
