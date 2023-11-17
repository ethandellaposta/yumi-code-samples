import React, { useState, useEffect } from 'react'
import { useFlags } from 'launchdarkly-react-client-sdk'

import axios from 'axios'
import get from 'utils/get'
import UserProps from 'types/UserProps'
import tracker from 'utils/tracker'
import ls from '../../repos/next-frontend/utils/ls'

import ShopifyContext from './shopifyContext'

const ShopifyProvider = ({ children }) => {
  const user_id = ls.get('userId')

  const createCart = async (products) => {
    tracker.event('ShopifyShopCreateCart')

    const res: any = await axios({
      url: `https://${
        process.env.NEXT_PUBLIC_SHOPIFY_CLIENT?.split('/')[1]
      }.myshopify.com/api/2022-04/graphql.json`,
      method: 'POST',
      headers: {
        'X-Shopify-Storefront-Access-Token': process.env.NEXT_PUBLIC_SHOPIFY_CLIENT?.split('/')[0]
      },
      data: {
        query: `
          mutation cartCreate ($input: CartInput!){
            cartCreate(input: $input) {
              cart {
                attributes {
                  key
                  value
                }
                checkoutUrl
                id
              }

            }
          }
        `,
        variables: {
          input: {
            lines: products.map((p) => ({
              merchandiseId: `gid://shopify/ProductVariant/${p.variant_id}`,
              quantity: p.quantity,
              sellingPlanId: p.selling_plan_id ? `gid://shopify/SellingPlan/${p.selling_plan_id}` : undefined
            }))
          }
        }
      }
    })

    return res.data.data.cartCreate.cart
  }

  useEffect(() => {
    if (user_id) {
      get(`v2/users/${user_id}`).then((user) => {
        setUser(user as UserProps)
      })
    }
  }, [user_id])

  const [user, setUser] = useState<UserProps | null>(null)

  const getCheckoutLink = async (cart, couponParam: string = ''): Promise<string> => {
    let coupon
    const checkoutLS: any = ls.get('checkout')
    if (checkoutLS) {
      coupon = checkoutLS.coupon
    } else {
      coupon = couponParam
    }

    try {
      let url = `${cart.checkoutUrl}${coupon ? `?discount=${coupon}` : ''}` as string

      if (user) {
        const { email, addresses, name } = user
        let address = addresses.find((a: any) => a.default === 1)
        if (!address) {
          address = addresses[addresses.length - 1]
        }

        url +=
          `${coupon ? '&' : '?'}checkout[email]=${email}` +
          `&checkout[shipping_address][first_name]=${name.split(' ')[0]}` +
          `&checkout[shipping_address][last_name]=${name.split(' ')[1] || ''}` +
          `&checkout[shipping_address][address1]=${address.street}` +
          `&checkout[shipping_address][address2]=${address.street2}` +
          `&checkout[shipping_address][city]=${address.city}` +
          `&checkout[shipping_address][zip]=${address.postcode}`
      }
      return url
    } catch (e) {
      return ''
    }
  }

  return (
    <ShopifyContext.Provider
      value={{
        actions: {
          getCheckoutLink,
          createCart
        }
      }}
    >
      {children}
    </ShopifyContext.Provider>
  )
}

export default ShopifyProvider
