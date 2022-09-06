import os
from setuptools import setup

setup(
    name='vstation-server',
    version='0.1.0',
    description='Server for managing VStation virtual machines',
    license='AGPL-3.0-or-later',
    keywords='server vm',
    scripts=['vstation-server'],
    install_requires=[
        'libvirt-python',
        'websockets',
        'websockify'
    ]
)
