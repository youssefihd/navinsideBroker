function mapLoadToForm(data, prev) {
  return {
    ...prev,

    // Dates
    pickupDate: data.pickupDate ? new Date(data.pickupDate) : null,
    deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : null,

    // Numbers
    pickupNumber: data.pickupNumber ?? prev.pickupNumber ?? "",
    dropoffNumber: data.dropoffNumber ?? prev.dropoffNumber ?? "",

    // Basic fields
    trackingNumber: data.trackingNumber ?? prev.trackingNumber ?? "",
    purchaseOrder: data.purchaseOrder ?? prev.purchaseOrder ?? "",
    shippingHours: data.shippingHours ?? prev.shippingHours ?? "",
    receivingHours: data.receivingHours ?? prev.receivingHours ?? "",
    quantity: data.quantity ?? prev.quantity ?? "",
    weight: data.weight ?? prev.weight ?? "",
    loadType: data.loadType ?? prev.loadType ?? "",
    dimensions: data.dimensions ?? prev.dimensions ?? "",

    // Shipper
    shipperId: data.pickUp?.id ?? prev.shipperId ?? null,
    shipperCompanyName: data.pickUp?.companyName ?? prev.shipperCompanyName ?? "",
    shipperContact: data.pickUp?.contact ?? prev.shipperContact ?? "",
    shipperPhoneNumber: data.pickUp?.phoneNumber ?? prev.shipperPhoneNumber ?? "",
    shipperAddress: data.pickUp?.address ?? prev.shipperAddress ?? "",
    shipperCity: data.pickUp?.city ?? prev.shipperCity ?? "",
    shipperPostalCode: data.pickUp?.postalCode ?? prev.shipperPostalCode ?? "",
    shipperProvince: data.pickUp?.province ?? prev.shipperProvince ?? "",
    shipperCountry: data.pickUp?.country ?? prev.shipperCountry ?? "",

    // Consignee
    consigneeId: data.delivery?.id ?? prev.consigneeId ?? null,
    consigneeCompanyName: data.delivery?.companyName ?? prev.consigneeCompanyName ?? "",
    consigneeContact: data.delivery?.contact ?? prev.consigneeContact ?? "",
    consigneePhoneNumber: data.delivery?.phoneNumber ?? prev.consigneePhoneNumber ?? "",
    consigneeAddress: data.delivery?.address ?? prev.consigneeAddress ?? "",
    consigneeCity: data.delivery?.city ?? prev.consigneeCity ?? "",
    consigneePostalCode: data.delivery?.postalCode ?? prev.consigneePostalCode ?? "",
    consigneeProvince: data.delivery?.province ?? prev.consigneeProvince ?? "",
    consigneeCountry: data.delivery?.country ?? prev.consigneeCountry ?? "",

    // Carrier
    carrierId: data.carrier?.id ?? prev.carrierId ?? null,
    carrierCompanyName: data.carrier?.companyName ?? prev.carrierCompanyName ?? "",
    carrierDispatcher: data.carrier?.dispatcher ?? prev.carrierDispatcher ?? "",
    carrierEmail: data.carrier?.email ?? prev.carrierEmail ?? "",
    carrierAddress: data.carrier?.address ?? prev.carrierAddress ?? "",
    carrierCompanyNumber: data.carrier?.companyNumber ?? prev.carrierCompanyNumber ?? "",

    // Equipment
    equipementIds: Array.isArray(data.equipements)
      ? data.equipements.map((eq) => eq.id)
      : prev.equipementIds ?? [],

    // Additional info
    type: data.type ?? prev.type ?? "",
    codType: data.codType ?? prev.codType ?? "COLLECT",
    status: data.status ?? prev.status ?? "Quoting",
    additionalInformation: data.additionalInformation ?? prev.additionalInformation ?? "",
    additionalShipper: data.additionalShipper ?? prev.additionalShipper ?? "",

    // Financials
    price: data.price ?? prev.price ?? 0,
    cost: data.cost ?? prev.cost ?? 0,
    priceAdditionalCharges: data.priceAdditionalCharges ?? prev.priceAdditionalCharges ?? 0,
    costAdditionalCharges: data.costAdditionalCharges ?? prev.costAdditionalCharges ?? 0,
    profit: data.profit ?? prev.profit ?? "0",
    profitPourcentage: data.profitPourcentage ?? prev.profitPourcentage ?? "0",
    // Client fields
clientId: data.client?.id ?? data.clientId ?? prev.clientId ?? null,
clientCompanyName: data.client?.companyName ?? prev.clientCompanyName ?? "",
clientContact: data.client?.contact ?? prev.clientContact ?? "",
clientPhoneNumber: data.client?.contactNumber ?? prev.clientPhoneNumber ?? "",
clientEmail: data.client?.email ?? prev.clientEmail ?? "",
clientAccountingEmail: data.client?.accountingEmail ?? prev.clientAccountingEmail ?? "",
clientAddress: data.client?.address ?? prev.clientAddress ?? "",
clientPostalCode: data.client?.postalCode ?? prev.clientPostalCode ?? "",
clientProvince: data.client?.province?.trim() ?? prev.clientProvince ?? "",
clientCountry: data.client?.country ?? prev.clientCountry ?? "",

// Missing top-level fields
appointment: data.appointment ?? prev.appointment ?? "",
weight: data.weight ?? prev.weight ?? "",
quantity: data.quantity ?? prev.quantity ?? "",
dimensions: data.dimensions ?? prev.dimensions ?? "",

  };
}
export default mapLoadToForm;