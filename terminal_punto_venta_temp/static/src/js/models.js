function openerp_tpv_models(instance, module){
     var Qweb = instance.web.qweb;
     var _t = instance.web._t;
     
     module.Order = module.Order.extend({
    	 export_as_JSON: function() {
             var orderLines, paymentLines;
             orderLines = [];
             (this.get('orderLines')).each(_.bind( function(item) {
                 return orderLines.push([0, 0, item.export_as_JSON()]);
             }, this));
             paymentLines = [];
             (this.get('paymentLines')).each(_.bind( function(item) {
                 return paymentLines.push([0, 0, item.export_as_JSON()]);
             }, this));
             return {
                 name: this.getName(),
                 amount_paid: this.getPaidTotal(),
                 amount_total: this.getTotalTaxIncluded(),
                 amount_tax: this.getTax(),
                 amount_return: this.getChange(),
                 lines: orderLines,
                 statement_ids: paymentLines,
                 pos_session_id: this.pos.pos_session.id,
                 partner_id: this.get_client() ? this.get_client().id : false,
                 user_id: this.pos.cashier ? this.pos.cashier.id : this.pos.user.id,
                 uid: this.uid,
                 sequence_number: this.sequence_number,
                 journal_temp_id: this.getJournalTempID(),
             };
         },
         getJournalTempID: function() {
             return this.pos.config.journal_temp_id;
         },
     });
};