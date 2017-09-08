function openerp_tpv_screens(instance, module){
     var Qweb = instance.web.qweb;
     var _t = instance.web._t;
     
     
     module.PaymentScreenWidget=module.PaymentScreenWidget.extend({
    	 
    	 show: function(){
             this._super();
             
             //Al llamar al super de esta clase, dibuja sus botones, los destruimos para volver a crearlos
             //de esta forma podremos ordenarlos de la forma que queramos.
             //FIXME buscar una forma de posicionar el un boton nuevo con respecto a otro.
             this.pos_widget.action_bar.destroy_buttons();
             
             var self = this;
             
             this.enable_numpad();
             this.focus_selected_line();
             
             document.body.addEventListener('keyup', this.hotkey_handler);

             this.add_action_button({
                 label: _t('Back'),
                 icon: '/point_of_sale/static/src/img/icons/png48/go-previous.png',
                 click: function(){  
                     self.back();
                 },
             });

             this.add_action_button({
                 label: _t('Validate'),
                 name: 'validation',
                 icon: '/point_of_sale/static/src/img/icons/png48/validate.png',
                 click: function(){
                     self.validate_order();
                 },
             });
             
             if( this.pos.config.iface_invoicing ){
                 this.add_action_button({
                     label: _t('Invoice'),
                     name: 'invoice',
                     icon: '/point_of_sale/static/src/img/icons/png48/invoice.png',
                     click: function(){
                         //self.validate_order({invoice: true});
                    	 self.click_factura();
                     },
                 });
             }
             
             if( this.pos.config.journal_03_id ){
	             this.add_action_button({
	    			 label: _t('Boleta'),
	    			 name: 'invoice_03',
	    			 icon: '/point_of_sale/static/src/img/icons/png48/invoice.png',
	    			 click: function(){
	    				 self.click_boleta();
	    				 //self.validate_order({invoice: true});
	    			 },
	    		 });
             }

             if( this.pos.config.iface_cashdrawer ){
                 this.add_action_button({
                     label: _t('Cash'),
                     name: 'cashbox',
                     icon: '/point_of_sale/static/src/img/open-cashbox.png',
                     click: function(){
                         self.pos.proxy.open_cashbox();
                     },
                 });
             }
             
             this.update_payment_summary();
         },
         
         click_factura:function(){
        	 //console.warn('Factura');
        	 this.pos.config.journal_temp_id = this.pos.config.journal_id[0];
        	 //console.log(this.pos.config.journal_temp_id);
        	 this.validate_order({invoice: true});
        	 this.pos.config.journal_temp_id = false
         },
    	
         click_boleta:function(){
        	 //console.log('Boleta');
        	 this.pos.config.journal_temp_id = this.pos.config.journal_03_id[0];
        	 //console.log(this.pos.config.journal_temp_id);
        	 this.validate_order({invoice: true});
        	 this.pos.config.journal_temp_id = false
         },
         
         update_payment_summary: function() {
             var currentOrder = this.pos.get('selectedOrder');
             var paidTotal = currentOrder.getPaidTotal();
             var dueTotal = currentOrder.getTotalTaxIncluded();
             var remaining = dueTotal > paidTotal ? dueTotal - paidTotal : 0;
             var change = paidTotal > dueTotal ? paidTotal - dueTotal : 0;

             this.$('.payment-due-total').html(this.format_currency(dueTotal));
             this.$('.payment-paid-total').html(this.format_currency(paidTotal));
             this.$('.payment-remaining').html(this.format_currency(remaining));
             this.$('.payment-change').html(this.format_currency(change));
             if(currentOrder.selected_orderline === undefined){
                 remaining = 1;  // What is this ? 
             }
                 
             if(this.pos_widget.action_bar){
                 this.pos_widget.action_bar.set_button_disabled('validation', !this.is_paid());
                 this.pos_widget.action_bar.set_button_disabled('invoice', !this.is_paid());
                 this.pos_widget.action_bar.set_button_disabled('invoice_03', !this.is_paid());
             }
         },
         
     	validate_order: function(options) {
        	var self = this;
			options = options || {};
			
			var currentOrder = this.pos.get('selectedOrder');
			
			if(currentOrder.get('orderLines').models.length === 0){
				this.pos_widget.screen_selector.show_popup('error',{
					'message': _t('Empty Order'),
					'comment': _t('There must be at least one product in your order before it can be validated'),
				});
				return;
			}
			
			var plines = currentOrder.get('paymentLines').models;
			for (var i = 0; i < plines.length; i++) {
				if (plines[i].get_type() === 'bank' && plines[i].get_amount() < 0) {
					this.pos_widget.screen_selector.show_popup('error',{
						'message': _t('Negative Bank Payment'),
						'comment': _t('You cannot have a negative amount in a Bank payment. Use a cash payment method to return money to the customer.'),
					});
					return;
				}
			}
			
			if(!this.is_paid()){
				return;
			}
			
			// The exact amount must be paid if there is no cash payment method defined.
			if (Math.abs(currentOrder.getTotalTaxIncluded() - currentOrder.getPaidTotal()) > 0.00001) {
				var cash = false;
				for (var i = 0; i < this.pos.cashregisters.length; i++) {
					cash = cash || (this.pos.cashregisters[i].journal.type === 'cash');
				}
				if (!cash) {
					this.pos_widget.screen_selector.show_popup('error',{
						message: _t('Cannot return change without a cash payment method'),
						comment: _t('There is no cash payment method available in this point of sale to handle the change.\n\n Please pay the exact amount or add a cash payment method in the point of sale configuration'),
					});
					return;
				}
			}
			
			if (this.pos.config.iface_cashdrawer) {
					this.pos.proxy.open_cashbox();
			}

             if(options.invoice){
                 // deactivate the validation button while we try to send the order
                 this.pos_widget.action_bar.set_button_disabled('validation',true);
                 this.pos_widget.action_bar.set_button_disabled('invoice',true);
                 this.pos_widget.action_bar.set_button_disabled('invoice_03',true);

                 var invoiced = this.pos.push_and_invoice_order(currentOrder);

                 invoiced.fail(function(error){
                	 if(error === 'error-no-client'){
         				self.pos_widget.screen_selector.show_popup('error',{
         					message: _t('An anonymous order cannot be invoiced'),
         					comment: _t('Please select a client for this order. This can be done by clicking the order tab'),
         				});
         			 }else{
         				self.pos_widget.screen_selector.show_popup('error',{
         					message: _t('The order could not be sent'),
         					comment: _t('Check your internet connection and try again.'),
         				});
         			 }
                     self.pos_widget.action_bar.set_button_disabled('validation',false);
                     self.pos_widget.action_bar.set_button_disabled('invoice',false);
                     self.pos_widget.action_bar.set_button_disabled('invoice_03',false);
                 });

                 invoiced.done(function(){
                     self.pos_widget.action_bar.set_button_disabled('validation',false);
                     self.pos_widget.action_bar.set_button_disabled('invoice',false);
                     self.pos_widget.action_bar.set_button_disabled('invoice_03',false);
                     self.pos.get('selectedOrder').destroy();
                 });
                 
             }else{
            	 //FIXME
            	 //Erro invocando Qweb.render(por mas que se haya definido al inicio de este archivo, 
            	 //por eso se realizó la llamada al super y este sea el quien llame a la 
            	 //impresión del comprobante, cuando se utiliza impresión directa a ticketera.
            	 //Sinembargo se realizó la consulta en Stackoverflow:
            	 //https://stackoverflow.com/questions/46103659/client-odoo-error-qweb-is-not-defined/46108811#46108811
            	 //
            	 this._super(options);
             }
             
            // hide onscreen (iOS) keyboard 
			setTimeout(function(){
				document.activeElement.blur();
				$("input").blur();
			},250);
             
         },
    	
     });
     
};