export interface IMailBody {
    subject: string;
    mail: string;
    body: string;
    eventType: string;
};


export interface IWatchListBody {
    userId?: string;
    ipaddress?: string;
    productLink: string;
    price: string;
    eventType: string;

};


export interface INotificationBody {
    userId?: string;
    ipaddress?: string;
    link?: string;
    message: string;
    eventType: string;

    title?: string;
};