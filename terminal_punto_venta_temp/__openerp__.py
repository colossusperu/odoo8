# -*- coding: utf-8 -*-
{
    'name': 'Personalización del Punto de Venta',
    'version': '1.0',
    'website' : '',
    'category': '',
    'summary': '',
    'description': """
Personalización del Terminal de Punto de Venta
======================================================
Este módulo añade Personalizaciones al módulo 
Terminal de Punto de Venta. 
""",
    'author': 'Juan Salcedo',
    'depends': [
        'point_of_sale',
    ],
    'data': [
        'point_of_sale_view.xml',
        'views/templates.xml',
    ],
    'demo': [
    ],
    'test': [
    ],
    'installable': True,
    'auto_install': False,
    'qweb': [
    ],
}
