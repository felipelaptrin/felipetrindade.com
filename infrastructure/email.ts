import { route53 } from "@pulumi/aws"
import { ICommonProps } from "./commons"

interface Record {
  type: "MX" | "TXT"
  subdomain?: string
  value: string[]
}

export interface IEmail {
  record: Record[]
  commonProps: ICommonProps
}

export class Email {
  id: string
  props: IEmail

  constructor(id: string, props: IEmail) {
    this.id = id
    this.props = props
    this.setRecords()
  }

  setRecords(): void {
    for(let i=0; i<this.props.record.length; i++){
      const subdomain = this.props.record[i].subdomain ?? '';
      new route53.Record(`${this.id}-${i}-record`, {
        zoneId: this.props.commonProps.zoneId,
        name: subdomain,
        type: this.props.record[i].type,
        records: this.props.record[i].value,
        ttl: 300
      })
    }
  }
}



