# -*- coding: utf-8 -*-

from openerp import fields, models, api, _

class pos_config(models.Model):
    _inherit = 'pos.config'
    
    journal_03_id = fields.Many2one('account.journal', string='Diario para Boleta', domain=[('type', '=', 'sale')],
             help="Diario usado para la emisión de Boletas.")
    journal_temp_id = fields.Many2one('account.journal')

class pos_order(models.Model):
    _inherit = 'pos.order'
    
    def _process_order(self, cr, uid, order, context=None):
        """
            Se hereda la funcionalidad de este método
            y se escribe en .v7, ya que se hace una llamada directa 
            desde otra función pasando parametros de .v7
        """
        journal_obj = self.pool.get('account.journal')
        pos_order_id = super(pos_order, self)._process_order(cr, uid, order, context=context)
        self.write(cr, uid, pos_order_id, {'sale_journal':order.get('journal_temp_id')}, context=context)
        return pos_order_id

    sale_journal = fields.Many2one('account.journal', string='Sale Journal', related='session_id.config_id.journal_temp_id', store=True, readonly=True)